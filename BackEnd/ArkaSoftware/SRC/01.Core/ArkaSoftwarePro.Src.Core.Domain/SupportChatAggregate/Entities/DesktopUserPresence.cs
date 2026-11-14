using Framework.Src.Core.Domain.Aggregates;

namespace ArkaSoftwarePro.Src.Core.Domain.SupportChatAggregate.Entities;

/// <summary>Desktop presence for online monitoring (chat / remote assist).</summary>
public class DesktopUserPresence : AggregateRoot
{
    public long UserId { get; private set; }
    public string? ConnectionId { get; private set; }
    public string Status { get; private set; } = DesktopPresenceStatus.Offline;
    public string? AppVersion { get; private set; }
    public string? DeviceId { get; private set; }
    public DateTime LastSeenAtUtc { get; private set; }
    public DateTime? ConnectedAtUtc { get; private set; }

    private DesktopUserPresence() { }

    public static DesktopUserPresence Create(long userId)
    {
        if (userId <= 0)
            throw new ArgumentException("User id is required.", nameof(userId));

        return new DesktopUserPresence
        {
            UserId = userId,
            Status = DesktopPresenceStatus.Offline,
            LastSeenAtUtc = DateTime.UtcNow,
        };
    }

    public void MarkOnline(string connectionId, string? appVersion, string? deviceId)
    {
        ConnectionId = connectionId;
        AppVersion = string.IsNullOrWhiteSpace(appVersion) ? AppVersion : appVersion.Trim();
        DeviceId = string.IsNullOrWhiteSpace(deviceId) ? DeviceId : deviceId.Trim();
        Status = DesktopPresenceStatus.Online;
        ConnectedAtUtc = DateTime.UtcNow;
        LastSeenAtUtc = DateTime.UtcNow;
    }

    public void Heartbeat()
    {
        LastSeenAtUtc = DateTime.UtcNow;
        if (Status == DesktopPresenceStatus.Offline)
            Status = DesktopPresenceStatus.Away;
    }

    public void MarkOffline()
    {
        Status = DesktopPresenceStatus.Offline;
        ConnectionId = null;
        LastSeenAtUtc = DateTime.UtcNow;
    }
}

public static class DesktopPresenceStatus
{
    public const string Online = "Online";
    public const string Away = "Away";
    public const string Offline = "Offline";
}
