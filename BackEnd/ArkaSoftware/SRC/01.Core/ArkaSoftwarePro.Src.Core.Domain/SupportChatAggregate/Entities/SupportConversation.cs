using ArkaSoftwarePro.Src.Core.Domain.SupportChatAggregate.Enumerations;
using Framework.Src.Core.Domain.Aggregates;

namespace ArkaSoftwarePro.Src.Core.Domain.SupportChatAggregate.Entities;

public class SupportConversation : AggregateRoot
{
    public long StudentUserId { get; private set; }
    public long TeacherUserId { get; private set; }
    public string Subject { get; private set; } = string.Empty;
    public SupportConversationStatus Status { get; private set; }
    public DateTime CreatedAtUtc { get; private set; }
    public DateTime? LastMessageAtUtc { get; private set; }
    public DateTime? StudentLastReadAtUtc { get; private set; }
    public DateTime? TeacherLastReadAtUtc { get; private set; }

    /// <summary>True when conversation may be synced to / opened from the desktop messenger hub.</summary>
    public bool IsDesktopEnabled { get; private set; } = true;

    public IReadOnlyList<SupportMessage> Messages => _messages;
    private readonly List<SupportMessage> _messages = new();

    private SupportConversation() { }

    public static SupportConversation Open(long studentUserId, long teacherUserId, string subject)
    {
        return new SupportConversation
        {
            StudentUserId = studentUserId,
            TeacherUserId = teacherUserId,
            Subject = subject.Trim(),
            Status = SupportConversationStatus.Open,
            CreatedAtUtc = DateTime.UtcNow,
            StudentLastReadAtUtc = DateTime.UtcNow,
            IsDesktopEnabled = true,
        };
    }

    public SupportMessage AddMessage(long senderUserId, string contentHtml, long? replyToMessageId = null, string? clientMessageId = null)
    {
        var message = SupportMessage.Create(senderUserId, contentHtml, replyToMessageId, clientMessageId);
        _messages.Add(message);
        LastMessageAtUtc = message.SentAtUtc;

        if (senderUserId == StudentUserId)
            StudentLastReadAtUtc = message.SentAtUtc;
        else if (senderUserId == TeacherUserId)
            TeacherLastReadAtUtc = message.SentAtUtc;

        return message;
    }

    public SupportMessage AddStaffMessage(long staffUserId, string contentHtml, long? replyToMessageId = null, string? clientMessageId = null)
    {
        var message = SupportMessage.CreateStaff(staffUserId, contentHtml, replyToMessageId, clientMessageId);
        _messages.Add(message);
        LastMessageAtUtc = message.SentAtUtc;
        return message;
    }

    public void MarkReadBy(long userId)
    {
        var now = DateTime.UtcNow;
        if (userId == StudentUserId)
            StudentLastReadAtUtc = now;
        else if (userId == TeacherUserId)
            TeacherLastReadAtUtc = now;
    }

    public bool IsParticipant(long userId) => userId == StudentUserId || userId == TeacherUserId;

    public long GetOtherParticipantUserId(long userId) =>
        userId == StudentUserId ? TeacherUserId : StudentUserId;

    public void UpdateSubject(string subject)
    {
        if (IsDelete)
            return;

        Subject = subject.Trim();
    }

    public void SetDesktopEnabled(bool enabled) => IsDesktopEnabled = enabled;

    public void MarkDeleted()
    {
        if (IsDelete)
            return;

        IsDelete = true;
    }

    public void Close()
    {
        Status = SupportConversationStatus.Closed;
    }

    public void Reopen()
    {
        Status = SupportConversationStatus.Open;
    }
}
