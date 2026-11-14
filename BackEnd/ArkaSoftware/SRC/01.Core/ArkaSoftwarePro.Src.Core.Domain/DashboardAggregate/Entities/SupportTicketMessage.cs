using Framework.Src.Core.Domain.Entities;

namespace ArkaSoftwarePro.Src.Core.Domain.DashboardAggregate.Entities;

public class SupportTicketMessage : Entity
{
    public long TicketId { get; private set; }
    public long SenderUserId { get; private set; }
    public bool IsStaffMessage { get; private set; }
    public string ContentHtml { get; private set; } = string.Empty;
    public DateTime SentAtUtc { get; private set; }
    public long? ReplyToMessageId { get; private set; }
    public DateTime? EditedAtUtc { get; private set; }

    private SupportTicketMessage() { }

    public static SupportTicketMessage Create(long senderUserId, string contentHtml, long? replyToMessageId = null)
    {
        return new SupportTicketMessage
        {
            SenderUserId = senderUserId,
            IsStaffMessage = false,
            ContentHtml = contentHtml ?? string.Empty,
            SentAtUtc = DateTime.UtcNow,
            ReplyToMessageId = replyToMessageId,
        };
    }

    public static SupportTicketMessage CreateStaff(long staffUserId, string contentHtml, long? replyToMessageId = null)
    {
        return new SupportTicketMessage
        {
            SenderUserId = staffUserId,
            IsStaffMessage = true,
            ContentHtml = contentHtml ?? string.Empty,
            SentAtUtc = DateTime.UtcNow,
            ReplyToMessageId = replyToMessageId,
        };
    }

    public void EditContent(string contentHtml)
    {
        if (IsDelete)
            return;

        ContentHtml = contentHtml ?? string.Empty;
        EditedAtUtc = DateTime.UtcNow;
    }

    public void MarkDeleted()
    {
        if (IsDelete)
            return;

        IsDelete = true;
        ContentHtml = string.Empty;
        EditedAtUtc = null;
    }
}
