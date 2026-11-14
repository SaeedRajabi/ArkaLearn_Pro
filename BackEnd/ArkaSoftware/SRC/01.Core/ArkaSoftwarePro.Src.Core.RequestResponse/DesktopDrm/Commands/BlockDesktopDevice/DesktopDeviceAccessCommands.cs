using ArkaSoftwarePro.Src.Core.Domain.DesktopDrmAggregate.Entities;
using Framework.Src.Core.RequestResponse.Commands;
using Framework.Src.Core.RequestResponse.Endpoints;

namespace ArkaSoftwarePro.Src.Core.RequestResponse.DesktopDrm.Commands.BlockDesktopDevice;

public class BlockDesktopDeviceCommand : ICommand<string>, IWebRequest
{
    public long DeviceRegistrationId { get; set; }
    public string Path => "/api/Service/DesktopDrm/BlockDevice";
}

public class UnblockDesktopDeviceCommand : ICommand<string>, IWebRequest
{
    public long DeviceRegistrationId { get; set; }
    public string Path => "/api/Service/DesktopDrm/UnblockDevice";
}

public class BlockDesktopUserAccessCommand : ICommand<string>, IWebRequest
{
    public long UserId { get; set; }
    public DesktopBlockScope Scope { get; set; } = DesktopBlockScope.EntireDesktopApp;
    public string? Reason { get; set; }
    public string Path => "/api/Service/DesktopDrm/BlockUserAccess";
}

public class UnblockDesktopUserAccessCommand : ICommand<string>, IWebRequest
{
    public long AccessBlockId { get; set; }
    public string Path => "/api/Service/DesktopDrm/UnblockUserAccess";
}
