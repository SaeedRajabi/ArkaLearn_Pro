using ArkaSoftwarePro.Src.Core.ApplicationService.SupportChatServices;
using ArkaSoftwarePro.Src.Core.ApplicationService.SupportSubscriptionServices;
using ArkaSoftwarePro.Src.Core.Contracts.SupportChat;
using ArkaSoftwarePro.Src.Core.Contracts.SupportChat.SupportChatRepositoryContracts.Commands;
using ArkaSoftwarePro.Src.Core.Contracts.UserNotifications.UserNotificationRepositoryContracts.Commands;
using ArkaSoftwarePro.Src.Core.Contracts.Users.UserRepositoryContracts.Queries;
using ArkaSoftwarePro.Src.Core.Domain.SupportChatAggregate.Enumerations;
using ArkaSoftwarePro.Src.Core.Domain.UserNotificationAggregate.Entities;
using ArkaSoftwarePro.Src.Core.RequestResponse.SupportChat.Commands.SendSupportMessage;
using ArkaSoftwarePro.Src.Core.RequestResponse.Users.Queries.GetById;
using Framework.Src.Core.ApplicationService.Commands;
using Framework.Src.Core.RequestResponse.Commands;
using Framework.Src.Core.RequestResponse.Common;
using Framework.Src.Utilities.OutService.Services;

namespace ArkaSoftwarePro.Src.Core.ApplicationService.SupportChatServices.Commands;

public class SendSupportMessageCommandHandler(
    ArkaSoftwareCMPOutServices outer,
    ISupportChatCommandRepository chatRepository,
    IUserNotificationCommandRepository notificationRepository,
    IUserQueryRepository userQueryRepository,
    ISupportChatRealtimeNotifier realtimeNotifier,
    ISupportChatSmsScheduler smsScheduler,
    IStudentSupportAccessService studentSupportAccessService)
    : CommandHandler<SendSupportMessageCommand, string>(outer)
{
    public override async Task<CommandResult<string>> Handle(SendSupportMessageCommand command)
    {
        if (command.UserId <= 0)
            return await ResultAsync("User not authenticated.", ApplicationServiceStatus.NotFound);

        var content = command.ContentHtml ?? string.Empty;
        if (!HasContent(content))
            return await ResultAsync("Message content is required.", ApplicationServiceStatus.ValidationError);

        var conversation = await chatRepository.GetConversationWithMessagesAsync(command.ConversationId);
        if (conversation == null || !conversation.IsParticipant(command.UserId))
            return await ResultAsync("Conversation not found.", ApplicationServiceStatus.NotFound);

        if (conversation.StudentUserId == command.UserId &&
            !await studentSupportAccessService.HasActiveStudentAccessAsync(command.UserId))
            return await ResultAsync("Your support subscription is inactive or frozen. Please renew or wait until freeze ends.", ApplicationServiceStatus.ValidationError);

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
            if (replyTarget.IsStaffMessage)
            {
                replyToSenderName = SupportChatStaffNames.DisplayNameFa;
            }
            else
            {
                var replySender = await userQueryRepository.ExecuteAsync(new GetUserByIdQuery { UserId = replyTarget.SenderUserId });
                replyToSenderName = SupportChatDisplayName.Build(replySender?.FirstName, replySender?.LastName, replySender?.UserName, replySender?.Email);
            }
            replyToContentPreview = SupportChatEventFactory.StripHtml(replyTarget.ContentHtml, 80);
        }

        var normalizedClientId = string.IsNullOrWhiteSpace(command.ClientMessageId)
            ? null
            : command.ClientMessageId.Trim();

        if (!string.IsNullOrWhiteSpace(normalizedClientId))
        {
            var existing = conversation.Messages.FirstOrDefault(m =>
                !m.IsDelete &&
                string.Equals(m.ClientMessageId, normalizedClientId, StringComparison.Ordinal));
            if (existing is not null)
                return await OkAsync(existing.Id.ToString());
        }

        var message = conversation.AddMessage(command.UserId, content, replyToMessageId, normalizedClientId);
        await chatRepository.CommitAsync();

        var recipientUserId = conversation.GetOtherParticipantUserId(command.UserId);
        var sender = await userQueryRepository.ExecuteAsync(new GetUserByIdQuery { UserId = command.UserId });
        var senderName = SupportChatDisplayName.Build(sender?.FirstName, sender?.LastName, sender?.UserName, sender?.Email);
        var preview = SupportChatEventFactory.StripHtml(content, 100);
        var isStudentSender = command.UserId == conversation.StudentUserId;

        var linkUrl = isStudentSender
            ? $"/professor/support?conversation={conversation.Id}"
            : $"/account?view=support&conversation={conversation.Id}";

        var title = isStudentSender ? "پیام جدید از دانشجو" : "پاسخ استاد";
        var body = isStudentSender
            ? $"{senderName} در موضوع «{conversation.Subject}» سوالی مطرح کرد: {preview}"
            : $"{senderName} در موضوع «{conversation.Subject}» پاسخ داد: {preview}";

        await notificationRepository.InsertAsync(UserNotification.Create(
            recipientUserId,
            title,
            body,
            "support_message_received",
            linkUrl,
            message.Id));

        await notificationRepository.CommitAsync();

        await realtimeNotifier.NotifyMessagePostedAsync(
            SupportChatEventFactory.BuildMessagePosted(conversation, message, senderName, replyToSenderName, replyToContentPreview));
        await realtimeNotifier.NotifyUserNotificationAsync(recipientUserId);

        await smsScheduler.ScheduleUnreadReminderAsync(
            conversation.Id,
            message.Id,
            recipientUserId,
            command.UserId,
            senderName,
            conversation.Subject,
            message.SentAtUtc);

        return await OkAsync(message.Id.ToString());
    }

    private static bool HasContent(string html) =>
        html.Replace("<p></p>", "", StringComparison.OrdinalIgnoreCase).Trim().Length >= 1;
}
