using ArkaSoftwarePro.Src.Core.ApplicationService.SupportChatServices;
using ArkaSoftwarePro.Src.Core.ApplicationService.SupportSubscriptionServices;
using ArkaSoftwarePro.Src.Core.Contracts.SupportChat;
using ArkaSoftwarePro.Src.Core.Contracts.SupportChat.SupportChatRepositoryContracts.Commands;
using ArkaSoftwarePro.Src.Core.Contracts.SupportChat.SupportChatRepositoryContracts.Queries;
using ArkaSoftwarePro.Src.Core.Contracts.UserNotifications.UserNotificationRepositoryContracts.Commands;
using ArkaSoftwarePro.Src.Core.Contracts.Users.UserRepositoryContracts.Queries;
using ArkaSoftwarePro.Src.Core.Domain.SupportChatAggregate.Entities;
using ArkaSoftwarePro.Src.Core.Domain.UserNotificationAggregate.Entities;
using ArkaSoftwarePro.Src.Core.RequestResponse.SupportChat.Commands.OpenSupportConversation;
using ArkaSoftwarePro.Src.Core.RequestResponse.Users.Queries.GetById;
using Framework.Src.Core.ApplicationService.Commands;
using Framework.Src.Core.RequestResponse.Commands;
using Framework.Src.Core.RequestResponse.Common;
using Framework.Src.Utilities.OutService.Services;

namespace ArkaSoftwarePro.Src.Core.ApplicationService.SupportChatServices.Commands;

public class OpenSupportConversationCommandHandler(
    ArkaSoftwareCMPOutServices outer,
    ISupportChatCommandRepository chatRepository,
    ISupportChatQueryRepository chatQueryRepository,
    IUserNotificationCommandRepository notificationRepository,
    IUserQueryRepository userQueryRepository,
    ISupportChatRealtimeNotifier realtimeNotifier,
    ISupportChatSmsScheduler smsScheduler,
    IStudentSupportAccessService studentSupportAccessService)
    : CommandHandler<OpenSupportConversationCommand, string>(outer)
{
    public override async Task<CommandResult<string>> Handle(OpenSupportConversationCommand command)
    {
        if (command.UserId <= 0)
            return await ResultAsync("User not authenticated.", ApplicationServiceStatus.NotFound);

        if (!await studentSupportAccessService.HasActiveStudentAccessAsync(command.UserId))
            return await ResultAsync("Your support subscription is inactive or frozen. Please renew or wait until freeze ends.", ApplicationServiceStatus.ValidationError);

        var subject = command.Subject?.Trim() ?? string.Empty;
        if (subject.Length < 3)
            return await ResultAsync("Subject must be at least 3 characters.", ApplicationServiceStatus.ValidationError);

        if (command.TeacherUserId <= 0)
            return await ResultAsync("Teacher is required.", ApplicationServiceStatus.ValidationError);

        if (!await chatQueryRepository.IsTeacherAllowedForStudentAsync(command.UserId, command.TeacherUserId))
            return await ResultAsync("You cannot open support with this teacher.", ApplicationServiceStatus.ValidationError);

        if (await chatQueryRepository.HasConversationWithSubjectAsync(command.UserId, command.TeacherUserId, subject))
            return await ResultAsync("A support topic with this subject already exists.", ApplicationServiceStatus.ValidationError);

        var conversation = SupportConversation.Open(command.UserId, command.TeacherUserId, subject);
        SupportMessage? initialMessage = null;

        var initialHtml = command.InitialMessageHtml?.Trim();
        if (!string.IsNullOrWhiteSpace(initialHtml) && HasContent(initialHtml))
            initialMessage = conversation.AddMessage(command.UserId, initialHtml);

        await chatRepository.InsertConversationAsync(conversation);
        await chatRepository.CommitAsync();

        var student = await userQueryRepository.ExecuteAsync(new GetUserByIdQuery { UserId = command.UserId });
        var studentName = SupportChatDisplayName.Build(student?.FirstName, student?.LastName, student?.UserName, student?.Email);

        string notificationBody;
        if (initialMessage != null)
        {
            var preview = SupportChatEventFactory.StripHtml(initialHtml!, 120);
            notificationBody = $"{studentName} در موضوع «{subject}» سوالی مطرح کرد: {preview}";
        }
        else
        {
            notificationBody = $"{studentName} موضوع «{subject}» را برای شما ثبت کرد.";
        }

        await notificationRepository.InsertAsync(UserNotification.Create(
            command.TeacherUserId,
            "سوال جدید از دانشجو",
            notificationBody,
            "support_conversation_opened",
            $"/professor/support?conversation={conversation.Id}",
            conversation.Id));

        await notificationRepository.CommitAsync();

        await realtimeNotifier.NotifyConversationOpenedAsync(new SupportChatConversationOpenedEvent
        {
            ConversationId = conversation.Id,
            StudentUserId = command.UserId,
            TeacherUserId = command.TeacherUserId,
            Subject = subject,
            StudentName = studentName,
            InitialMessagePreview = initialMessage == null ? null : SupportChatEventFactory.StripHtml(initialHtml!, 120),
        });

        if (initialMessage != null)
        {
            await realtimeNotifier.NotifyMessagePostedAsync(
                SupportChatEventFactory.BuildMessagePosted(conversation, initialMessage, studentName));

            await smsScheduler.ScheduleUnreadReminderAsync(
                conversation.Id,
                initialMessage.Id,
                command.TeacherUserId,
                command.UserId,
                studentName,
                subject,
                initialMessage.SentAtUtc);
        }

        return await OkAsync(conversation.Id.ToString());
    }

    private static bool HasContent(string html) =>
        html.Replace("<p></p>", "", StringComparison.OrdinalIgnoreCase).Trim().Length >= 3;
}
