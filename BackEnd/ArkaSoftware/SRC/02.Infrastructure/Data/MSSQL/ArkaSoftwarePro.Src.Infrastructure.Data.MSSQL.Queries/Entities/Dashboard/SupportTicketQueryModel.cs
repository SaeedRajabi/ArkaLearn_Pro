namespace ArkaSoftwarePro.Src.Infrastructure.Data.MSSQL.Queries.Entities.Dashboard;

public class SupportTicketQueryModel
{
    public long Id { get; set; }
    public int DisplayNumber { get; set; }
    public string TicketSource { get; set; } = string.Empty;
    public string Subject { get; set; } = string.Empty;
    public string Message { get; set; } = string.Empty;
    public string Status { get; set; } = string.Empty;
    public string Department { get; set; } = string.Empty;
    public string RequesterName { get; set; } = string.Empty;
    public string RequesterEmail { get; set; } = string.Empty;
    public string? RequesterAvatarUrl { get; set; }
    public long? RequesterUserId { get; set; }
    public string? AdminReply { get; set; }
    public DateTime? RepliedAt { get; set; }
    public long? RepliedByUserId { get; set; }
    public DateTime? FirstViewedAtUtc { get; set; }
    public long? FirstViewedByUserId { get; set; }
    public DateTime? ClosedAtUtc { get; set; }
    public int? Rating { get; set; }
    public string? RatingComment { get; set; }
    public DateTime? LastMessageAtUtc { get; set; }
    public string? LastMessagePreview { get; set; }
    public DateTime? CreatedDateTime { get; set; }
    public bool IsDelete { get; set; }
}
