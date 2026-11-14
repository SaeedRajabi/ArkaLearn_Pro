using Framework.Src.Core.RequestResponse.Commands;
using Framework.Src.Core.RequestResponse.Endpoints;

namespace ArkaSoftwarePro.Src.Core.RequestResponse.DesktopApp.Commands.DeleteDesktopAppRelease;

public class DeleteDesktopAppReleaseCommand : ICommand<string>, IWebRequest
{
    public long ReleaseId { get; set; }
    public string Path => "/api/Service/DesktopApp/DeleteRelease";
}

