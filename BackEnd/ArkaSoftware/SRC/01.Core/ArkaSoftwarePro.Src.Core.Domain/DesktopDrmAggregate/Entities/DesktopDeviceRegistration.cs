using Framework.Src.Core.Domain.Aggregates;

namespace ArkaSoftwarePro.Src.Core.Domain.DesktopDrmAggregate.Entities;

public class DesktopDeviceRegistration : AggregateRoot
{
    public long UserId { get; private set; }
    public string DeviceId { get; private set; } = string.Empty;
    public string? MachineName { get; private set; }
    public string? OsVersion { get; private set; }
    public string? AppVersion { get; private set; }
    public DateTime RegisteredAtUtc { get; private set; }
    public DateTime LastHeartbeatAtUtc { get; private set; }
    public bool IsBlocked { get; private set; }
    /// <summary>Only one device per user may hold an active desktop login.</summary>
    public bool HasActiveLogin { get; private set; }
    public DateTime? ActiveLoginAtUtc { get; private set; }

    private DesktopDeviceRegistration() { }

    public static DesktopDeviceRegistration Register(
        long userId,
        string deviceId,
        string? machineName,
        string? osVersion,
        string? appVersion)
    {
        if (userId <= 0) throw new ArgumentException("User id is required.", nameof(userId));
        if (string.IsNullOrWhiteSpace(deviceId)) throw new ArgumentException("Device id is required.", nameof(deviceId));

        var now = DateTime.UtcNow;
        return new DesktopDeviceRegistration
        {
            UserId = userId,
            DeviceId = deviceId.Trim(),
            MachineName = string.IsNullOrWhiteSpace(machineName) ? null : machineName.Trim(),
            OsVersion = string.IsNullOrWhiteSpace(osVersion) ? null : osVersion.Trim(),
            AppVersion = string.IsNullOrWhiteSpace(appVersion) ? null : appVersion.Trim(),
            RegisteredAtUtc = now,
            LastHeartbeatAtUtc = now,
            IsBlocked = false,
            HasActiveLogin = false,
            ActiveLoginAtUtc = null,
        };
    }

    public void Heartbeat(string? appVersion)
    {
        LastHeartbeatAtUtc = DateTime.UtcNow;
        if (!string.IsNullOrWhiteSpace(appVersion))
            AppVersion = appVersion.Trim();
    }

    public void ActivateLogin(string? appVersion = null)
    {
        Heartbeat(appVersion);
        HasActiveLogin = true;
        ActiveLoginAtUtc = DateTime.UtcNow;
    }

    public void DeactivateLogin()
    {
        HasActiveLogin = false;
        ActiveLoginAtUtc = null;
        LastHeartbeatAtUtc = DateTime.UtcNow;
    }

    public void Block()
    {
        IsBlocked = true;
        DeactivateLogin();
    }

    public void Unblock() => IsBlocked = false;
}
