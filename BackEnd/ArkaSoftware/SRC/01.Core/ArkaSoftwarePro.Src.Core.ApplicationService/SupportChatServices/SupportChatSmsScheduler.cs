using ArkaSoftwarePro.Src.Core.Contracts.NotificationSettings;
using ArkaSoftwarePro.Src.Core.Contracts.Sms;
using ArkaSoftwarePro.Src.Core.Contracts.SupportChat;
using ArkaSoftwarePro.Src.Core.Contracts.SupportChat.SupportChatRepositoryContracts.Commands;
using ArkaSoftwarePro.Src.Core.Domain.SupportChatAggregate.Entities;

namespace ArkaSoftwarePro.Src.Core.ApplicationService.SupportChatServices;

public sealed class SupportChatSmsScheduler(
    ISupportChatCommandRepository chatRepository,
    INotificationSettingsProvider settingsProvider,
    ISmsNotificationService smsNotificationService) : ISupportChatSmsScheduler
{
    public async Task ScheduleUnreadReminderAsync(
        long conversationId,
        long messageId,
        long recipientUserId,
        long senderUserId,
        string senderDisplayName,
        string subject,
        DateTime messageSentAtUtc,
        CancellationToken cancellationToken = default)
    {
        var settings = await settingsProvider.GetCurrentAsync(cancellationToken);
        if (settings is null || !settings.CanSendSms || !settings.SupportChatSmsEnabled)
            return;

        await chatRepository.CancelPendingSmsRemindersAsync(conversationId, recipientUserId, cancellationToken);

        var delayMinutes = settings.SupportChatUnreadSmsDelayMinutes;
        var reminder = SupportChatSmsReminder.Schedule(
            conversationId,
            messageId,
            recipientUserId,
            senderUserId,
            senderDisplayName,
            subject,
            messageSentAtUtc,
            DateTime.UtcNow.AddMinutes(delayMinutes));

        await chatRepository.InsertSmsReminderAsync(reminder, cancellationToken);
        await chatRepository.CommitAsync(cancellationToken);
    }

    public async Task CancelPendingRemindersForReadAsync(
        long conversationId,
        long recipientUserId,
        CancellationToken cancellationToken = default)
    {
        await chatRepository.CancelPendingSmsRemindersAsync(conversationId, recipientUserId, cancellationToken);
        await chatRepository.CommitAsync(cancellationToken);
    }

    public async Task ProcessDueRemindersAsync(CancellationToken cancellationToken = default)
    {
        var due = await chatRepository.GetDueSmsRemindersAsync(DateTime.UtcNow, 50, cancellationToken);
        if (due.Count == 0) return;

        foreach (var reminder in due)
        {
            var conversation = await chatRepository.GetConversationByIdAsync(reminder.ConversationId, cancellationToken);
            if (conversation == null)
            {
                reminder.Cancel();
                continue;
            }

            var lastRead = reminder.RecipientUserId == conversation.StudentUserId
                ? conversation.StudentLastReadAtUtc
                : conversation.TeacherLastReadAtUtc;

            if (lastRead.HasValue && lastRead.Value >= reminder.MessageSentAtUtc)
            {
                reminder.Cancel();
                continue;
            }

            var recipientIsTeacher = reminder.RecipientUserId == conversation.TeacherUserId;

            await smsNotificationService.TrySendSupportUnreadReminderAsync(
                reminder.RecipientUserId,
                reminder.SenderDisplayName,
                reminder.Subject,
                reminder.ConversationId,
                recipientIsTeacher,
                cancellationToken);

            reminder.MarkSent();
        }

        await chatRepository.CommitAsync(cancellationToken);
    }
}
