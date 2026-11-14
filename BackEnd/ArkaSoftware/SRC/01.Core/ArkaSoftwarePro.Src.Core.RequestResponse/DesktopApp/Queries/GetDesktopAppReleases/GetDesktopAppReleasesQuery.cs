using Framework.Src.Core.RequestResponse.Queries;

namespace ArkaSoftwarePro.Src.Core.RequestResponse.DesktopApp.Queries.GetDesktopAppReleases;

public class GetDesktopAppReleasesQuery : IQuery<List<DesktopAppReleaseAdminQri>>
{
}

public class DesktopAppReleaseAdminQri
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
}
