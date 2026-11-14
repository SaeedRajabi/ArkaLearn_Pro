using Framework.Src.Core.RequestResponse.Commands;

namespace ArkaSoftwarePro.Src.Core.RequestResponse.SupportChat.Commands.HeartbeatDesktopPresence;

public class HeartbeatDesktopPresenceCommand : ICommand<string>
{
    public long UserId { get; set; }
    public string? ConnectionId { get; set; }
    public string? AppVersion { get; set; }
    public string? DeviceId { get; set; }
    public bool IsOnline { get; set; } = true;
}
