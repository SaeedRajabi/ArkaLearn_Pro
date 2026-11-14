using Framework.Src.Core.RequestResponse.Queries;

namespace ArkaSoftwarePro.Src.Core.RequestResponse.DesktopApp.Queries.CheckDesktopAppUpdate;

public class CheckDesktopAppUpdateQuery : IQuery<DesktopAppUpdateQri>
{
    public string? CurrentVersion { get; set; }
}

public class DesktopAppUpdateQri
{
    public bool UpdateAvailable { get; set; }
    public bool IsMandatory { get; set; }
    public string? LatestVersion { get; set; }
    public string? InstallerUrl { get; set; }
    public string? ReleaseNotes { get; set; }
    public string? MinSupportedVersion { get; set; }
}
