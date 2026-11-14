using Framework.Src.Core.RequestResponse.Commands;
using Framework.Src.Core.RequestResponse.Endpoints;

namespace ArkaSoftwarePro.Src.Core.RequestResponse.Rooms.Commands.SetRoomUserBlocked;

/// <summary>Host/moderator action: persists block on a seat (e.g. after kick-and-block).</summary>
public class SetRoomUserBlockedCommand : ICommand<string>, IWebRequest
{
    public long RoomId { get; set; }

    public long RoomUserId { get; set; }

    public bool Blocked { get; set; } = true;

    public string Path => "/api/Service/Room/SetRoomUserBlocked";
}
