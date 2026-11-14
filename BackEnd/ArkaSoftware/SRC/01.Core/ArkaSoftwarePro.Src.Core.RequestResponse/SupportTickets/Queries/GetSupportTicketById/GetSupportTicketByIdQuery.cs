using Framework.Src.Core.RequestResponse.Queries;

namespace ArkaSoftwarePro.Src.Core.RequestResponse.SupportTickets.Queries.GetSupportTicketById;

public class GetSupportTicketByIdQuery : IQuery<SupportTicketQri>
{
    public long TicketId { get; set; }
}

public class SupportTicketQri
{
    public long Id { get; set; }
    public int DisplayNumber { get; set; }
    public string Subject { get; set; } = string.Empty;
    public string Message { get; set; } = string.Empty;
    public string Status { get; set; } = string.Empty;
    public string RequesterName { get; set; } = string.Empty;
    public string RequesterEmail { get; set; } = string.Empty;
    public string? RequesterAvatarUrl { get; set; }
    public string? AdminReply { get; set; }
    public DateTime? RepliedAt { get; set; }
    public long? RepliedByUserId { get; set; }
    public DateTime? CreatedDateTime { get; set; }
}
