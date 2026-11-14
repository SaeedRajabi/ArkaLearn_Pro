namespace ArkaSoftwarePro.Src.Infrastructure.Data.MSSQL.Queries.Entities.Desktop;

public class OfflinePlaybackGrantQueryModel
{
    public long Id { get; set; }
    public long UserId { get; set; }
    public long CourseId { get; set; }
    public string TokenHash { get; set; } = string.Empty;
    public DateTime ExpiresAtUtc { get; set; }
    public DateTime? RevokedAtUtc { get; set; }
    public string? DeviceId { get; set; }
    public bool IsDelete { get; set; }
}
