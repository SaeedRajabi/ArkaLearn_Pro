using Framework.Src.Core.RequestResponse.Queries;

namespace ArkaSoftwarePro.Src.Core.RequestResponse.DesktopDrm.Queries.GetDesktopDeviceRegistrations;

public class GetDesktopDeviceRegistrationsQuery : IQuery<List<DesktopDeviceRegistrationAdminQri>>
{
    public long? UserId { get; set; }
    public int Take { get; set; } = 100;
}

public class DesktopDeviceRegistrationAdminQri
{
    public long Id { get; set; }
    public long UserId { get; set; }
    public string DeviceId { get; set; } = string.Empty;
    public string? MachineName { get; set; }
    public string? OsVersion { get; set; }
    public string? AppVersion { get; set; }
    public DateTime RegisteredAtUtc { get; set; }
    public DateTime LastHeartbeatAtUtc { get; set; }
    public bool IsBlocked { get; set; }
}
