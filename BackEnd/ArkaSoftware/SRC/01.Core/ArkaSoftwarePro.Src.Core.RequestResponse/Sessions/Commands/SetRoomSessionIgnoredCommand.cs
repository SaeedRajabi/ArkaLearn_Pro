using Framework.Src.Core.RequestResponse.Commands;

namespace ArkaSoftwarePro.Src.Core.RequestResponse.Sessions.Commands;

public class SetRoomSessionIgnoredCommand : ICommand<bool>
{
    public long RoomId { get; set; }
    public long SessionId { get; set; }
    public bool Ignored { get; set; }
}
