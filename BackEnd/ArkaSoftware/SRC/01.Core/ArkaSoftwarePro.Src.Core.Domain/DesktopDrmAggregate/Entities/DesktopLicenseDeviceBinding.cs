using ArkaSoftwarePro.Src.Core.Domain.DesktopDrmAggregate.Enumerations;
using Framework.Src.Core.Domain.Aggregates;

namespace ArkaSoftwarePro.Src.Core.Domain.DesktopDrmAggregate.Entities;

/// <summary>Per-enrollment activation of a desktop license on a specific device.</summary>
public class DesktopLicenseDeviceBinding : AggregateRoot
{
    public long EnrollmentId { get; private set; }
    public string DeviceId { get; private set; } = string.Empty;
    public DesktopOsFamily OsFamily { get; private set; } = DesktopOsFamily.Windows;
    public string? MachineName { get; private set; }
    public DateTime ActivatedAtUtc { get; private set; }
    public DateTime? RevokedAtUtc { get; private set; }
    public string? RevokeReason { get; private set; }

    private DesktopLicenseDeviceBinding() { }

    public bool IsActive => !RevokedAtUtc.HasValue;

    public static DesktopLicenseDeviceBinding Activate(
        long enrollmentId,
        string deviceId,
        DesktopOsFamily osFamily,
        string? machineName)
    {
        if (enrollmentId <= 0) throw new ArgumentException("Enrollment id is required.", nameof(enrollmentId));
        if (string.IsNullOrWhiteSpace(deviceId)) throw new ArgumentException("Device id is required.", nameof(deviceId));

        return new DesktopLicenseDeviceBinding
        {
            EnrollmentId = enrollmentId,
            DeviceId = deviceId.Trim(),
            OsFamily = osFamily == DesktopOsFamily.None ? DesktopOsFamily.Windows : osFamily,
            MachineName = string.IsNullOrWhiteSpace(machineName) ? null : machineName.Trim(),
            ActivatedAtUtc = DateTime.UtcNow,
        };
    }

    public void Revoke(string? reason)
    {
        RevokedAtUtc = DateTime.UtcNow;
        RevokeReason = string.IsNullOrWhiteSpace(reason) ? null : reason.Trim();
    }
}
