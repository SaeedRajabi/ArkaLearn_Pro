using ArkaSoftwarePro.Src.Core.Domain.DesktopDrmAggregate.Enumerations;

namespace ArkaSoftwarePro.Src.Infrastructure.Data.MSSQL.Queries.Entities.Desktop;

public class DesktopLicenseDeviceBindingQueryModel
{
    public long Id { get; set; }
    public long EnrollmentId { get; set; }
    public string DeviceId { get; set; } = string.Empty;
    public DesktopOsFamily OsFamily { get; set; }
    public string? MachineName { get; set; }
    public DateTime ActivatedAtUtc { get; set; }
    public DateTime? RevokedAtUtc { get; set; }
    public string? RevokeReason { get; set; }
    public bool IsDelete { get; set; }
}
