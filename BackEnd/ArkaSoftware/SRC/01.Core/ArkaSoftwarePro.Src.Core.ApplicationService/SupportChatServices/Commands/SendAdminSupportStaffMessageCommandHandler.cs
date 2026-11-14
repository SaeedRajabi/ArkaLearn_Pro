using ArkaSoftwarePro.Src.Core.ApplicationService.SupportChatServices;
using ArkaSoftwarePro.Src.Core.Contracts.SupportChat;
using ArkaSoftwarePro.Src.Core.Contracts.SupportChat.SupportChatRepositoryContracts.Commands;
using ArkaSoftwarePro.Src.Core.Contracts.UserNotifications.UserNotificationRepositoryContracts.Commands;
using ArkaSoftwarePro.Src.Core.Contracts.Users.UserRepositoryContracts.Queries;
using ArkaSoftwarePro.Src.Core.Domain.SupportChatAggregate.Enumerations;
using ArkaSoftwarePro.Src.Core.Domain.UserNotificationAggregate.Entities;
using ArkaSoftwarePro.Src.Core.RequestResponse.SupportChat.Commands.SendAdminSupportStaffMessage;
using ArkaSoftwarePro.Src.Core.RequestResponse.Users.Queries.GetById;
using Framework.Src.Core.ApplicationService.Commands;
using Framework.Src.Core.RequestResponse.Commands;
using Framework.Src.Core.RequestResponse.Common;
using Framework.Src.Utilities.OutService.Services;

namespace ArkaSoftwarePro.Src.Core.ApplicationService.SupportChatServices.Commands;

public class SendAdminSupportStaffMessageCommandHandler(
    ArkaSoftwareCMPOutServices outer,
    ISupportChatCommandRepository chatRepository,
    IUserNotificationCommandRepository notificationRepository,
    IUserQueryRepository userQueryRepository,
    ISupportChatRealtimeNotifier realtimeNotifier,
    ISupportChatSmsScheduler smsScheduler)
    : CommandHandler<SendAdminSupportStaffMessageCommand, string>(outer)
{
    public override async Task<CommandResult<string>> Handle(SendAdminSupportStaffMessageCommand command)
    {
        if (command.StaffUserId <= 0)
            return await ResultAsync("User not authenticated.", ApplicationServiceStatus.NotFound);

        var content = command.ContentHtml ?? string.Empty;
        if (!HasContent(content))
            return await ResultAsync("Message content is required.", ApplicationServiceStatus.ValidationError);

        var conversation = await chatRepository.GetConversationWithMessagesAsync(command.ConversationId);
        if (conversation == null || conversation.TeacherUserId != command.TeacherUserId)
            return await ResultAsync("Conversation not found.", ApplicationServiceStatus.NotFound);

        if (conversation.Status == SupportConversationStatus.Closed)
            return await ResultAsync("This conversation is closed.", ApplicationServiceStatus.ValidationError);

        long? replyToMessageId = null;
        string? replyToSenderName = null;
        string? replyToContentPreview = null;

        if (command.ReplyToMessageId is > 0)
        {
            var replyTarget = conversation.Messages.FirstOrDefault(m => m.Id == command.ReplyToMessageId.Value);
            if (replyTarget == null || replyTarget.IsDelete)
                return await ResultAsync("Reply target not found.", ApplicationServiceStatus.ValidationError);

            replyToMessageId = replyTarget.Id;
            replyToSenderName = replyTarget.IsStaffMessage
                ? SupportChatStaffNames.DisplayNameFa
                : await ResolveUserDisplayNameAsync(replyTarget.SenderUserId);
            replyToContentPreview = SupportChatEventFactory.StripHtml(replyTarget.ContentHtml, 80);
        }

        var message = conversation.AddStaffMessage(command.StaffUserId, content, replyToMessageId);
        await chatRepository.CommitAsync();

        var senderName = SupportChatStaffNames.DisplayNameFa;
        var preview = SupportChatEventFactory.StripHtml(content, 100);

        foreach (var recipientUserId in new[] { conversation.StudentUserId, conversation.TeacherUserId })
        {
            var linkUrl = recipientUserId == conversation.TeacherUserId
                ? $"/professor/support?conversation={conversation.Id}"
                : $"/account?view=support&conversation={conversation.Id}";

            await notificationRepository.InsertAsync(UserNotification.Create(
                recipientUserId,
                "پیام پشتیبانی آرکا نرم افزار",
                $"{senderName} در موضوع «{conversation.Subject}» پیام داد: {preview}",
                "support_message_received",
                linkUrl,
                message.Id));
        }

        await notificationRepository.CommitAsync();

        await realtimeNotifier.NotifyMessagePostedAsync(
            SupportChatEventFactory.BuildMessagePosted(
                conversation,
                message,
                senderName,
                replyToSenderName,
                replyToContentPreview));

        foreach (var recipientUserId in new[] { conversation.StudentUserId, conversation.TeacherUserId })
            await realtimeNotifier.NotifyUserNotificationAsync(recipientUserId);

        await smsScheduler.ScheduleUnreadReminderAsync(
            conversation.Id,
            message.Id,
            conversation.StudentUserId,
            command.StaffUserId,
            senderName,
            conversation.Subject,
            message.SentAtUtc);

        await smsScheduler.ScheduleUnreadReminderAsync(
            conversation.Id,
            message.Id,
            conversation.TeacherUserId,
            command.StaffUserId,
            senderName,
            conversation.Subject,
            message.SentAtUtc);

        return await OkAsync(message.Id.ToString());
    }

    private async Task<string> ResolveUserDisplayNameAsync(long userId)
    {
        var user = await userQueryRepository.ExecuteAsync(new GetUserByIdQuery { UserId = userId });
        return SupportChatDisplayName.Build(user?.FirstName, user?.LastName, user?.UserName, user?.Email);
    }

    private static bool HasContent(string html) =>
        html.Replace("<p></p>", "", StringComparison.OrdinalIgnoreCase).Trim().Length >= 1;
}
