namespace ArkaSoftwarePro.Src.Infrastructure.Data.MSSQL.Queries.Entities.Dashboard;

public class SupportTicketMessageQueryModel
{
    public long Id { get; set; }
    public long TicketId { get; set; }
    public long SenderUserId { get; set; }
    public bool IsStaffMessage { get; set; }
    public string ContentHtml { get; set; } = string.Empty;
    public DateTime SentAtUtc { get; set; }
    public long? ReplyToMessageId { get; set; }
    public DateTime? EditedAtUtc { get; set; }
    public bool IsDelete { get; set; }
}
