using Framework.Src.Core.RequestResponse.Commands;

namespace ArkaSoftwarePro.Src.Core.RequestResponse.Sessions.Commands;

public class EndRoomSessionCommand : ICommand<bool>
{
    public long RoomId { get; set; }
}