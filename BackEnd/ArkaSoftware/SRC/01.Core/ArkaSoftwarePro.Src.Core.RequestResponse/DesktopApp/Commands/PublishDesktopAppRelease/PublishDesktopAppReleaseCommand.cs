using Framework.Src.Core.RequestResponse.Commands;
using Framework.Src.Core.RequestResponse.Endpoints;

namespace ArkaSoftwarePro.Src.Core.RequestResponse.DesktopApp.Commands.PublishDesktopAppRelease;

public class PublishDesktopAppReleaseCommand : ICommand<long>, IWebRequest
{
    public string Version { get; set; } = string.Empty;
    public string InstallerUrl { get; set; } = string.Empty;
    public string? ReleaseNotes { get; set; }
    public bool IsMandatory { get; set; }
    public string? MinSupportedVersion { get; set; }
    public string Path => "/api/Service/DesktopApp/PublishRelease";
}
