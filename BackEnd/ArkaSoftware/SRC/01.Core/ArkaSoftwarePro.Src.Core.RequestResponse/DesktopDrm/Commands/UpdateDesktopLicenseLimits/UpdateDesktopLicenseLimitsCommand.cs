using ArkaSoftwarePro.Src.Core.Domain.DesktopDrmAggregate.Enumerations;
using Framework.Src.Core.RequestResponse.Commands;

namespace ArkaSoftwarePro.Src.Core.RequestResponse.DesktopDrm.Commands.UpdateDesktopLicenseLimits;

public class UpdateDesktopLicenseLimitsCommand : ICommand<DesktopLicenseLimitsResultQri>
{
    public long RequestingUserId { get; set; }
    public long EnrollmentId { get; set; }
    public int MaxDevices { get; set; } = 1;
    public DesktopOsFamily AllowedOs { get; set; } = DesktopOsFamily.Windows;
}

public class DesktopLicenseLimitsResultQri
{
    public long EnrollmentId { get; set; }
    public int MaxDevices { get; set; }
    public DesktopOsFamily AllowedOs { get; set; }
}
