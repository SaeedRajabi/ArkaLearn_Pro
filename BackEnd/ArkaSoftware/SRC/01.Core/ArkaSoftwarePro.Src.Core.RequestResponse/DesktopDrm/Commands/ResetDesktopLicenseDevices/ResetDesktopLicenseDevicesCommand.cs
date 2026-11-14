using Framework.Src.Core.RequestResponse.Commands;

namespace ArkaSoftwarePro.Src.Core.RequestResponse.DesktopDrm.Commands.ResetDesktopLicenseDevices;

/// <summary>
/// Clears all device bindings / playback grants for a student course license
/// so the next desktop activation can bind a fresh machine.
/// </summary>
public class ResetDesktopLicenseDevicesCommand : ICommand<ResetDesktopLicenseDevicesResultQri>
{
    public long RequestingUserId { get; set; }
    public long EnrollmentId { get; set; }
    public string? Reason { get; set; }
}

public class ResetDesktopLicenseDevicesResultQri
{
    public long EnrollmentId { get; set; }
    public int RevokedDeviceCount { get; set; }
    public bool Cleared { get; set; }
}
