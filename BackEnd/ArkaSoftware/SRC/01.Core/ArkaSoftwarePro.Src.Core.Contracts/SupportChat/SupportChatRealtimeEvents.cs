namespace ArkaSoftwarePro.Src.Core.Contracts.SupportChat;

public sealed class SupportChatMessagePostedEvent
{
    public long ConversationId { get; init; }
    public long MessageId { get; init; }
    public long SenderUserId { get; init; }
    public string SenderName { get; init; } = string.Empty;
    public string ContentHtml { get; init; } = string.Empty;
    public string SentAtUtc { get; init; } = string.Empty;
    public string Subject { get; init; } = string.Empty;
    public long StudentUserId { get; init; }
    public long TeacherUserId { get; init; }
    public long? ReplyToMessageId { get; init; }
    public string? ReplyToSenderName { get; init; }
    public string? ReplyToContentPreview { get; init; }
}

public sealed class SupportChatMessageUpdatedEvent
{
    public long ConversationId { get; init; }
    public long MessageId { get; init; }
    public long SenderUserId { get; init; }
    public string ContentHtml { get; init; } = string.Empty;
    public string? EditedAtUtc { get; init; }
    public long StudentUserId { get; init; }
    public long TeacherUserId { get; init; }
}

public sealed class SupportChatMessageDeletedEvent
{
    public long ConversationId { get; init; }
    public long MessageId { get; init; }
    public long StudentUserId { get; init; }
    public long TeacherUserId { get; init; }
}

public sealed class SupportChatConversationUpdatedEvent
{
    public long ConversationId { get; init; }
    public string Subject { get; init; } = string.Empty;
    public long StudentUserId { get; init; }
    public long TeacherUserId { get; init; }
}

public sealed class SupportChatConversationDeletedEvent
{
    public long ConversationId { get; init; }
    public long StudentUserId { get; init; }
    public long TeacherUserId { get; init; }
}

public sealed class SupportChatConversationOpenedEvent
{
    public long ConversationId { get; init; }
    public long StudentUserId { get; init; }
    public long TeacherUserId { get; init; }
    public string Subject { get; init; } = string.Empty;
    public string StudentName { get; init; } = string.Empty;
    public string? InitialMessagePreview { get; init; }
}

public sealed class SupportChatConversationStatusEvent
{
    public long ConversationId { get; init; }
    public string Status { get; init; } = string.Empty;
    public long StudentUserId { get; init; }
    public long TeacherUserId { get; init; }
}

public sealed class SupportChatMessagesDeliveredEvent
{
    public long ConversationId { get; init; }
    public long RecipientUserId { get; init; }
    public long StudentUserId { get; init; }
    public long TeacherUserId { get; init; }
    public List<long> MessageIds { get; init; } = [];
    public string DeliveredAtUtc { get; init; } = string.Empty;
}

public sealed class SupportChatMessagesReadEvent
{
    public long ConversationId { get; init; }
    public long ReaderUserId { get; init; }
    public long StudentUserId { get; init; }
    public long TeacherUserId { get; init; }
    public string? StudentLastReadAtUtc { get; init; }
    public string? TeacherLastReadAtUtc { get; init; }
}
