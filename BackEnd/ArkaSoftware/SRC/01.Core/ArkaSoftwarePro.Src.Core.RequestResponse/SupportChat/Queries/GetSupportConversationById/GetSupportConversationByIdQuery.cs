using Framework.Src.Core.RequestResponse.Endpoints;
using Framework.Src.Core.RequestResponse.Queries;

namespace ArkaSoftwarePro.Src.Core.RequestResponse.SupportChat.Queries.GetSupportConversationById;

public class GetSupportConversationByIdQuery : IQuery<SupportConversationDetailQri>, IWebRequest
{
    public long UserId { get; set; }
    public long ConversationId { get; set; }
    public int MessageTake { get; set; } = 10;
    public long? BeforeMessageId { get; set; }
    public string Path => "/api/Service/SupportChat/GetById";
}

public class SupportConversationDetailQri
{
    public long Id { get; set; }
    public string Subject { get; set; } = string.Empty;
    public string Status { get; set; } = string.Empty;
    public long StudentUserId { get; set; }
    public long TeacherUserId { get; set; }
    public string StudentName { get; set; } = string.Empty;
    public string TeacherName { get; set; } = string.Empty;
    public DateTime CreatedAtUtc { get; set; }
    public bool HasRating { get; set; }
    public bool HasMoreOlderMessages { get; set; }
    public DateTime? StudentLastReadAtUtc { get; set; }
    public DateTime? TeacherLastReadAtUtc { get; set; }
    public List<SupportMessageQri> Messages { get; set; } = [];
}

public class SupportMessageQri
{
    public long Id { get; set; }
    public long SenderUserId { get; set; }
    public string SenderName { get; set; } = string.Empty;
    public string ContentHtml { get; set; } = string.Empty;
    public DateTime SentAtUtc { get; set; }
    public bool IsMine { get; set; }
    public bool IsDeleted { get; set; }
    public DateTime? EditedAtUtc { get; set; }
    public long? ReplyToMessageId { get; set; }
    public string? ReplyToSenderName { get; set; }
    public string? ReplyToContentPreview { get; set; }
    public bool IsStaffMessage { get; set; }
    public string? DeliveryStatus { get; set; }
}
