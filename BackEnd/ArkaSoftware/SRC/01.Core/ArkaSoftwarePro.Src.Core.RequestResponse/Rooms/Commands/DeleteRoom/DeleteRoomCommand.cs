using Framework.Src.Core.RequestResponse.Commands;
using Framework.Src.Core.RequestResponse.Endpoints;

namespace ArkaSoftwarePro.Src.Core.RequestResponse.Rooms.Commands.DeleteRoom;

public class DeleteRoomCommand : ICommand<string>, IWebRequest
{
    public long RoomId { get; set; }
    public string Path => "/api/Service/Room/Delete";
}
