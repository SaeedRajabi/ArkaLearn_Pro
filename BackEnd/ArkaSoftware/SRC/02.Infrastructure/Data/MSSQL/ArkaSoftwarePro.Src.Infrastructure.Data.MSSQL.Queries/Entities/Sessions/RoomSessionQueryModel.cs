namespace ArkaSoftwarePro.Src.Infrastructure.Data.MSSQL.Queries.Entities.Sessions;

public class RoomSessionQueryModel
{
    public long Id { get; set; }
    public long RoomId { get; set; }
    public DateTime StartTime { get; set; }
    public DateTime? EndTime { get; set; }
    public string Status { get; set; } = string.Empty;
    public string? StartedByUserId { get; set; }
    public bool IsIgnored { get; set; }
}