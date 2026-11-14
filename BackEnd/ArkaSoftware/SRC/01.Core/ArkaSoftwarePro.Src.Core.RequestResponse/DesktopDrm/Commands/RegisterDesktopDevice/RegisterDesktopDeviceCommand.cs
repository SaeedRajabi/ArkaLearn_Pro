using Framework.Src.Core.RequestResponse.Commands;
using Framework.Src.Core.RequestResponse.Endpoints;

namespace ArkaSoftwarePro.Src.Core.RequestResponse.DesktopDrm.Commands.RegisterDesktopDevice;

public class RegisterDesktopDeviceCommand : ICommand<DesktopAccessStatusQri>, IWebRequest
{
    public long UserId { get; set; }
    public string DeviceId { get; set; } = string.Empty;
    public string? MachineName { get; set; }
    public string? OsVersion { get; set; }
    public string? AppVersion { get; set; }
    public string Path => "/api/Service/DesktopDrm/RegisterDevice";
}
