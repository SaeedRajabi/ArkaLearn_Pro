using Framework.Src.Core.RequestResponse.Commands;
using Framework.Src.Core.RequestResponse.Endpoints;

namespace ArkaSoftwarePro.Src.Core.RequestResponse.DesktopDrm.Commands.LogoutDesktopSession;

public class LogoutDesktopSessionCommand : ICommand<string>, IWebRequest
{
    public long UserId { get; set; }
    public string DeviceId { get; set; } = string.Empty;

    public string Path => "/api/Service/DesktopDrm/LogoutSession";
}
