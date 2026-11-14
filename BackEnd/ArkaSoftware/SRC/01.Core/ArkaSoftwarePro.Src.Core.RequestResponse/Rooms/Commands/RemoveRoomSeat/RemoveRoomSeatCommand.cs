using Framework.Src.Core.RequestResponse.Commands;

namespace ArkaSoftwarePro.Src.Core.RequestResponse.Rooms.Commands.RemoveRoomSeat;

public class RemoveRoomSeatCommand : ICommand<bool>
{
    public long RoomId { get; set; }
    public long RoomUserId { get; set; }
}
