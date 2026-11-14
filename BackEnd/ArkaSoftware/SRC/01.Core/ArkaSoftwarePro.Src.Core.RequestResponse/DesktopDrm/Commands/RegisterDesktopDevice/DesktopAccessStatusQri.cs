namespace ArkaSoftwarePro.Src.Core.RequestResponse.DesktopDrm.Commands.RegisterDesktopDevice;

public class DesktopAccessStatusQri
{
    public bool IsAllowed { get; set; } = true;
    public bool IsDeviceBlocked { get; set; }
    public bool IsUserBlocked { get; set; }
    public string? BlockReason { get; set; }
    public string? BlockScope { get; set; }
    public long? DeviceRegistrationId { get; set; }
}
