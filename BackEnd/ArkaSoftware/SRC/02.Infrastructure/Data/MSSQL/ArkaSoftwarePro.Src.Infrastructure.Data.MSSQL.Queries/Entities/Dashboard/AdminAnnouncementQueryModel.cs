namespace ArkaSoftwarePro.Src.Infrastructure.Data.MSSQL.Queries.Entities.Dashboard;

public class AdminAnnouncementQueryModel
{
    public long Id { get; set; }
    public string Title { get; set; } = string.Empty;
    public string Body { get; set; } = string.Empty;
    public byte Priority { get; set; }
    public bool IsActive { get; set; }
    public DateTime? ExpiresUtc { get; set; }
    public DateTime? CreatedDateTime { get; set; }
    public bool IsDelete { get; set; }
}
