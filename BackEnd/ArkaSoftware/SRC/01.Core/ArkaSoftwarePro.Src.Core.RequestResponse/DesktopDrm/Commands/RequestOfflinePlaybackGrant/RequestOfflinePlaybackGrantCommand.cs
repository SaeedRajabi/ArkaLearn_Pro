using Framework.Src.Core.RequestResponse.Commands;

namespace ArkaSoftwarePro.Src.Core.RequestResponse.DesktopDrm.Commands.RequestOfflinePlaybackGrant;

public class RequestOfflinePlaybackGrantCommand : ICommand<OfflinePlaybackGrantQri>
{
    public long UserId { get; set; }
    public long CourseId { get; set; }
    public string? DeviceId { get; set; }
    public string? OsVersion { get; set; }
    public string? MachineName { get; set; }
}

public class OfflinePlaybackGrantQri
{
    public string GrantToken { get; set; } = string.Empty;
    public long CourseId { get; set; }
    public DateTime ExpiresAtUtc { get; set; }
    public int TtlHours { get; set; } = 72;
}
