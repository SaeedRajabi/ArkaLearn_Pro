using Framework.Src.Core.RequestResponse.Commands;
using Framework.Src.Core.RequestResponse.Endpoints;

namespace ArkaSoftwarePro.Src.Core.RequestResponse.Rooms.Commands.LogoutUserFromRoom
{
    public class LogoutUserFromRoomCommand : ICommand<object>, IWebRequest
    {
        public long UserId { get; set; }
        public long RoomId { get; set; }
        public string Path => "/api/Service/Account/LogoutRoomUser";
    }
}
