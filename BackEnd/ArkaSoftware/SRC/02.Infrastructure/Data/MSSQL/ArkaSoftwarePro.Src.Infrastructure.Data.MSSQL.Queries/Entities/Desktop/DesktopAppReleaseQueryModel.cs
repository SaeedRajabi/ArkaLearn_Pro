namespace ArkaSoftwarePro.Src.Infrastructure.Data.MSSQL.Queries.Entities.Desktop;

public class DesktopAppReleaseQueryModel
{
    public long Id { get; set; }
    public string Version { get; set; } = string.Empty;
    public string InstallerUrl { get; set; } = string.Empty;
    public string? ReleaseNotes { get; set; }
    public bool IsMandatory { get; set; }
    public string? MinSupportedVersion { get; set; }
    public DateTime PublishedAtUtc { get; set; }
    public bool IsPublished { get; set; }
    public long? PublishedByAdminUserId { get; set; }
    public bool IsDelete { get; set; }
}
