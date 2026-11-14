using Framework.Src.Core.Domain.Aggregates;

namespace ArkaSoftwarePro.Src.Core.Domain.DesktopDrmAggregate.Entities;

public class DesktopAppLicense : AggregateRoot
{
    public long UserId { get; private set; }
    public DesktopLicenseStatus Status { get; private set; }
    public DateTime? ExpiresAtUtc { get; private set; }
    public string? DeviceFingerprint { get; private set; }
    public DateTime IssuedAtUtc { get; private set; }
    public DateTime? LastValidatedAtUtc { get; private set; }
    public string? RevokeReason { get; private set; }
    public long? IssuedByAdminUserId { get; private set; }

    private DesktopAppLicense() { }

    public static DesktopAppLicense Issue(
        long userId,
        DateTime? expiresAtUtc,
        long? issuedByAdminUserId,
        string? deviceFingerprint = null)
    {
        if (userId <= 0)
            throw new ArgumentException("User id is required.", nameof(userId));

        return new DesktopAppLicense
        {
            UserId = userId,
            Status = DesktopLicenseStatus.Active,
            ExpiresAtUtc = expiresAtUtc,
            DeviceFingerprint = string.IsNullOrWhiteSpace(deviceFingerprint) ? null : deviceFingerprint.Trim(),
            IssuedAtUtc = DateTime.UtcNow,
            IssuedByAdminUserId = issuedByAdminUserId,
        };
    }

    public bool IsUsable(DateTime utcNow)
    {
        if (IsDelete || Status is DesktopLicenseStatus.Revoked or DesktopLicenseStatus.Blocked)
            return false;
        if (ExpiresAtUtc.HasValue && utcNow >= ExpiresAtUtc.Value)
            return false;
        return Status == DesktopLicenseStatus.Active;
    }

    public bool MatchesDevice(string? deviceId)
    {
        if (string.IsNullOrWhiteSpace(DeviceFingerprint))
            return true;
        if (string.IsNullOrWhiteSpace(deviceId))
            return false;
        return string.Equals(DeviceFingerprint, deviceId.Trim(), StringComparison.OrdinalIgnoreCase);
    }

    /// <summary>Locks the app license to the first device; rejects a different machine later.</summary>
    public bool TryBindOrValidateDevice(string deviceId, out string? errorMessage)
    {
        if (string.IsNullOrWhiteSpace(deviceId))
        {
            errorMessage = "شناسه دستگاه نامعتبر است.";
            return false;
        }

        var normalized = deviceId.Trim();
        if (string.IsNullOrWhiteSpace(DeviceFingerprint))
        {
            DeviceFingerprint = normalized;
            errorMessage = null;
            return true;
        }

        if (!string.Equals(DeviceFingerprint, normalized, StringComparison.OrdinalIgnoreCase))
        {
            errorMessage = "لایسنس ویدیو قبلاً روی یک سیستم دیگر فعال شده و فقط روی همان سیستم قابل استفاده است.";
            return false;
        }

        errorMessage = null;
        return true;
    }

    public void MarkValidated(DateTime utcNow) => LastValidatedAtUtc = utcNow;

    /// <summary>Clears the machine lock so the next validation can bind a new device.</summary>
    public void ClearDeviceFingerprint()
    {
        DeviceFingerprint = null;
    }

    public void Revoke(string? reason)
    {
        Status = DesktopLicenseStatus.Revoked;
        RevokeReason = string.IsNullOrWhiteSpace(reason) ? null : reason.Trim();
    }

    public void Block(string? reason)
    {
        Status = DesktopLicenseStatus.Blocked;
        RevokeReason = string.IsNullOrWhiteSpace(reason) ? null : reason.Trim();
    }

    public void Unblock()
    {
        if (Status == DesktopLicenseStatus.Blocked)
            Status = DesktopLicenseStatus.Active;
    }

    public void SoftDelete()
    {
        if (IsDelete) return;
        IsDelete = true;
        Status = DesktopLicenseStatus.Revoked;
    }
}

public enum DesktopLicenseStatus
{
    Active = 0,
    Expired = 1,
    Revoked = 2,
    Blocked = 3,
}
