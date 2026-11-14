using Framework.Src.Core.RequestResponse.Queries;

namespace ArkaSoftwarePro.Src.Core.RequestResponse.SupportTickets.Queries.GetPlatformSupportTicketById;

public class GetPlatformSupportTicketByIdQuery : IQuery<PlatformSupportTicketDetailQri>
{
    public long UserId { get; set; }
    public long TicketId { get; set; }
    public int MessageTake { get; set; } = 10;
    public long? BeforeMessageId { get; set; }
}

public class GetMyPlatformSupportTicketsQuery : IQuery<List<PlatformSupportTicketListQri>>
{
    public long UserId { get; set; }
}

public class GetAdminPlatformSupportTicketByIdQuery : IQuery<PlatformSupportTicketDetailQri>
{
    public long StaffUserId { get; set; }
    public long TicketId { get; set; }
    public int MessageTake { get; set; } = 10;
    public long? BeforeMessageId { get; set; }
}

public class PlatformSupportTicketListQri
{
    public long Id { get; set; }
    public int DisplayNumber { get; set; }
    public string DisplayCode { get; set; } = string.Empty;
    public string Subject { get; set; } = string.Empty;
    public string Status { get; set; } = string.Empty;
    public string Department { get; set; } = string.Empty;
    public DateTime? CreatedDateTime { get; set; }
    public DateTime? LastMessageAtUtc { get; set; }
    public string? LastMessagePreview { get; set; }
}

public class PlatformSupportTicketDetailQri
{
    public long Id { get; set; }
    public int DisplayNumber { get; set; }
    public string DisplayCode { get; set; } = string.Empty;
    public string TicketSource { get; set; } = string.Empty;
    public string Subject { get; set; } = string.Empty;
    public string Status { get; set; } = string.Empty;
    public string Department { get; set; } = string.Empty;
    public string RequesterName { get; set; } = string.Empty;
    public string RequesterEmail { get; set; } = string.Empty;
    public string? RequesterAvatarUrl { get; set; }
    public long? RequesterUserId { get; set; }
    public string? Message { get; set; }
    public string? AdminReply { get; set; }
    public DateTime? FirstViewedAtUtc { get; set; }
    public DateTime? ClosedAtUtc { get; set; }
    public int? Rating { get; set; }
    public string? RatingComment { get; set; }
    public DateTime? CreatedDateTime { get; set; }
    public bool HasMoreOlderMessages { get; set; }
    public List<PlatformSupportTicketMessageQri> Messages { get; set; } = [];
}

public class PlatformSupportTicketMessageQri
{
    public long Id { get; set; }
    public long SenderUserId { get; set; }
    public string SenderName { get; set; } = string.Empty;
    public string ContentHtml { get; set; } = string.Empty;
    public DateTime SentAtUtc { get; set; }
    public bool IsMine { get; set; }
    public bool IsStaffMessage { get; set; }
    public bool IsDeleted { get; set; }
    public DateTime? EditedAtUtc { get; set; }
    public long? ReplyToMessageId { get; set; }
    public string? ReplyToSenderName { get; set; }
    public string? ReplyToContentPreview { get; set; }
}
