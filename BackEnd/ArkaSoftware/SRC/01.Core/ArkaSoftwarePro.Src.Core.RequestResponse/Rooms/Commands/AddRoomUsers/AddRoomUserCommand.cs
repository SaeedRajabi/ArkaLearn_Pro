using Framework.Src.Core.RequestResponse.Commands;
using Framework.Src.Core.RequestResponse.Endpoints;

namespace ArkaSoftwarePro.Src.Core.RequestResponse.Rooms.Commands.AddRoomUsers
{
    public class AddRoomUserCommand:ICommand<string> , IWebRequest
    {
        public long RoomId { get; set; }
        public string FirstName { get; set; } = string.Empty;
        public string LastName { get; set; } = string.Empty;
        public string UserName { get; set; } = string.Empty;
        public string Password { get; set; } = string.Empty;

        public string Path => "api/Service/Room/AddUser";
    }
}
