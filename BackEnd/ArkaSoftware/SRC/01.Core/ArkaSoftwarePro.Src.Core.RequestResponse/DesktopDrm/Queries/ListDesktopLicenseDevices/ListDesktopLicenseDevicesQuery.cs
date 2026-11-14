using ArkaSoftwarePro.Src.Core.Domain.DesktopDrmAggregate.Enumerations;
using Framework.Src.Core.RequestResponse.Queries;

namespace ArkaSoftwarePro.Src.Core.RequestResponse.DesktopDrm.Queries.ListDesktopLicenseDevices;

public class ListDesktopLicenseDevicesQuery : IQuery<List<DesktopLicenseDeviceBindingQri>>
{
    public long RequestingUserId { get; set; }
    public long EnrollmentId { get; set; }
}

public class DesktopLicenseDeviceBindingQri
{
    public long Id { get; set; }
    public long EnrollmentId { get; set; }
    public string DeviceId { get; set; } = string.Empty;
    public DesktopOsFamily OsFamily { get; set; }
    public string? MachineName { get; set; }
    public DateTime ActivatedAtUtc { get; set; }
    public DateTime? RevokedAtUtc { get; set; }
    public string? RevokeReason { get; set; }
    public bool IsActive { get; set; }
}
