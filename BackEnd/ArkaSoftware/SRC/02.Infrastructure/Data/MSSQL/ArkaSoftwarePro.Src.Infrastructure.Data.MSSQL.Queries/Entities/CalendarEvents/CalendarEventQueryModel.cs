namespace ArkaSoftwarePro.Src.Infrastructure.Data.MSSQL.Queries.Entities.CalendarEvents;

public class CalendarEventQueryModel
{
    public long Id { get; set; }
    public string Title { get; set; } = string.Empty;
    public int Category { get; set; }
    public DateTime StartUtc { get; set; }
    public DateTime EndUtc { get; set; }
    public bool IsAllDay { get; set; }
    public string? EventUrl { get; set; }
    public string? Description { get; set; }
    public long OwnerUserId { get; set; }
    public bool IsDelete { get; set; }
}
