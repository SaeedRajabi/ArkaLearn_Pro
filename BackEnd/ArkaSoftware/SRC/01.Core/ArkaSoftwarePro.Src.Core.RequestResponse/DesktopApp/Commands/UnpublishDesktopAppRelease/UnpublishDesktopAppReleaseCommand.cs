using Framework.Src.Core.RequestResponse.Commands;
using Framework.Src.Core.RequestResponse.Endpoints;

namespace ArkaSoftwarePro.Src.Core.RequestResponse.DesktopApp.Commands.UnpublishDesktopAppRelease;

public class UnpublishDesktopAppReleaseCommand : ICommand<string>, IWebRequest
{
    public long ReleaseId { get; set; }
    public string Path => "/api/Service/DesktopApp/UnpublishRelease";
}
