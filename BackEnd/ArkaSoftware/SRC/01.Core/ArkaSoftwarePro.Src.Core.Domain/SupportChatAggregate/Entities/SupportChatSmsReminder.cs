using Framework.Src.Core.Domain.Entities;

namespace ArkaSoftwarePro.Src.Core.Domain.SupportChatAggregate.Entities;

public class SupportChatSmsReminder : Entity
{
    public long ConversationId { get; private set; }
    public long MessageId { get; private set; }
    public long RecipientUserId { get; private set; }
    public long SenderUserId { get; private set; }
    public string SenderDisplayName { get; private set; } = string.Empty;
    public string Subject { get; private set; } = string.Empty;
    public DateTime MessageSentAtUtc { get; private set; }
    public DateTime ScheduledAtUtc { get; private set; }
    public DateTime? SentAtUtc { get; private set; }
    public DateTime? CancelledAtUtc { get; private set; }

    private SupportChatSmsReminder() { }

    public bool IsPending => SentAtUtc == null && CancelledAtUtc == null;

    public static SupportChatSmsReminder Schedule(
        long conversationId,
        long messageId,
        long recipientUserId,
        long senderUserId,
        string senderDisplayName,
        string subject,
        DateTime messageSentAtUtc,
        DateTime scheduledAtUtc)
    {
        return new SupportChatSmsReminder
        {
            ConversationId = conversationId,
            MessageId = messageId,
            RecipientUserId = recipientUserId,
            SenderUserId = senderUserId,
            SenderDisplayName = senderDisplayName.Trim(),
            Subject = subject.Trim(),
            MessageSentAtUtc = messageSentAtUtc,
            ScheduledAtUtc = scheduledAtUtc,
        };
    }

    public void MarkSent() => SentAtUtc = DateTime.UtcNow;

    public void Cancel() => CancelledAtUtc = DateTime.UtcNow;
}
