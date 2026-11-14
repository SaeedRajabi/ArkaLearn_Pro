using Framework.Src.Core.RequestResponse.Commands;

namespace ArkaSoftwarePro.Src.Core.RequestResponse.DesktopDrm.Commands.RevokeDesktopLicenseDevice;

public class RevokeDesktopLicenseDeviceCommand : ICommand<DesktopLicenseDeviceRevokeResultQri>
{
    public long RequestingUserId { get; set; }
    public long EnrollmentId { get; set; }
    public string DeviceId { get; set; } = string.Empty;
    public string? Reason { get; set; }
}

public class DesktopLicenseDeviceRevokeResultQri
{
    public long EnrollmentId { get; set; }
    public string DeviceId { get; set; } = string.Empty;
    public bool Revoked { get; set; }
}
