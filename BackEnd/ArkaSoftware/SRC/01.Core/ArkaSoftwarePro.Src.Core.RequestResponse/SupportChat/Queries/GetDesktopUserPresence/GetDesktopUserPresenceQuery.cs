using Framework.Src.Core.RequestResponse.Queries;

namespace ArkaSoftwarePro.Src.Core.RequestResponse.SupportChat.Queries.GetDesktopUserPresence;

public class GetDesktopUserPresenceQuery : IQuery<DesktopUserPresenceQri>
{
    public long TargetUserId { get; set; }
}

public class DesktopUserPresenceQri
{
    public long UserId { get; set; }
    public string Status { get; set; } = "Offline";
    public bool IsOnline { get; set; }
    public DateTime? LastSeenAtUtc { get; set; }
}
