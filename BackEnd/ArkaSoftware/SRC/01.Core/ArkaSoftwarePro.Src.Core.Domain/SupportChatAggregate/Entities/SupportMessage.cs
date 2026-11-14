using Framework.Src.Core.Domain.Entities;

namespace ArkaSoftwarePro.Src.Core.Domain.SupportChatAggregate.Entities;

public class SupportMessage : Entity
{
    public long ConversationId { get; private set; }
    public long SenderUserId { get; private set; }
    public bool IsStaffMessage { get; private set; }
    public string ContentHtml { get; private set; } = string.Empty;
    public DateTime SentAtUtc { get; private set; }
    public DateTime? DeliveredAtUtc { get; private set; }
    public DateTime? SeenAtUtc { get; private set; }
    public long? ReplyToMessageId { get; private set; }
    public DateTime? EditedAtUtc { get; private set; }

    /// <summary>Client-generated id for offline-first / idempotent desktop sync.</summary>
    public string? ClientMessageId { get; private set; }

    public string? AttachmentUrl { get; private set; }
    public string? AttachmentFileName { get; private set; }
    public long? AttachmentSizeBytes { get; private set; }
    public string? AttachmentContentType { get; private set; }
    public string? AttachmentUploadSessionId { get; private set; }

    private SupportMessage() { }

    public static SupportMessage Create(long senderUserId, string contentHtml, long? replyToMessageId = null, string? clientMessageId = null)
    {
        return new SupportMessage
        {
            SenderUserId = senderUserId,
            IsStaffMessage = false,
            ContentHtml = contentHtml ?? string.Empty,
            SentAtUtc = DateTime.UtcNow,
            ReplyToMessageId = replyToMessageId,
            ClientMessageId = NormalizeClientId(clientMessageId),
        };
    }

    public static SupportMessage CreateStaff(long staffUserId, string contentHtml, long? replyToMessageId = null, string? clientMessageId = null)
    {
        return new SupportMessage
        {
            SenderUserId = staffUserId,
            IsStaffMessage = true,
            ContentHtml = contentHtml ?? string.Empty,
            SentAtUtc = DateTime.UtcNow,
            ReplyToMessageId = replyToMessageId,
            ClientMessageId = NormalizeClientId(clientMessageId),
        };
    }

    public void AttachFile(string url, string fileName, long sizeBytes, string? contentType, string? uploadSessionId = null)
    {
        if (string.IsNullOrWhiteSpace(url))
            throw new ArgumentException("Attachment URL is required.", nameof(url));

        AttachmentUrl = url.Trim();
        AttachmentFileName = string.IsNullOrWhiteSpace(fileName) ? "file" : fileName.Trim();
        AttachmentSizeBytes = sizeBytes >= 0 ? sizeBytes : 0;
        AttachmentContentType = string.IsNullOrWhiteSpace(contentType) ? null : contentType.Trim();
        AttachmentUploadSessionId = string.IsNullOrWhiteSpace(uploadSessionId) ? null : uploadSessionId.Trim();
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

    public bool MarkDelivered(DateTime deliveredAtUtc)
    {
        if (DeliveredAtUtc.HasValue)
            return false;

        DeliveredAtUtc = deliveredAtUtc;
        return true;
    }

    public bool MarkSeen(DateTime seenAtUtc)
    {
        if (SeenAtUtc.HasValue)
            return false;

        SeenAtUtc = seenAtUtc;
        DeliveredAtUtc ??= seenAtUtc;
        return true;
    }

    private static string? NormalizeClientId(string? value) =>
        string.IsNullOrWhiteSpace(value) ? null : value.Trim()[..Math.Min(value.Trim().Length, 64)];
}
