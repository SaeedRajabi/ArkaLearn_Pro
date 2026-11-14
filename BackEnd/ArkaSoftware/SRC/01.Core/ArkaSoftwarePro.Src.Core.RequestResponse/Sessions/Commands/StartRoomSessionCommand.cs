using Framework.Src.Core.RequestResponse.Commands;

namespace ArkaSoftwarePro.Src.Core.RequestResponse.Sessions.Commands;

public class StartRoomSessionCommand : ICommand<long>
{
    public long RoomId { get; set; }
    public string? StartedByUserId { get; set; }
}