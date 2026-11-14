namespace ArkaSoftwarePro.Src.Core.Contracts.SupportChat;

public interface ISupportChatSmsScheduler
{
    Task ScheduleUnreadReminderAsync(
        long conversationId,
        long messageId,
        long recipientUserId,
        long senderUserId,
        string senderDisplayName,
        string subject,
        DateTime messageSentAtUtc,
        CancellationToken cancellationToken = default);

    Task CancelPendingRemindersForReadAsync(
        long conversationId,
        long recipientUserId,
        CancellationToken cancellationToken = default);

    Task ProcessDueRemindersAsync(CancellationToken cancellationToken = default);
}
