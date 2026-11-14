using Framework.Src.Core.RequestResponse.Commands;
using Framework.Src.Core.RequestResponse.Endpoints;

namespace ArkaSoftwarePro.Src.Core.RequestResponse.Rooms.Commands.LoginUserIntoRoom
{
    public class LoginUserIntoRoomCommand:ICommand<object> , IWebRequest
    {
        public long RoomId { get; set; }
        public string? UserName { get; set; } = string.Empty;
        public string? Password { get; set; } = string.Empty;
        public bool IsGuest { get; set; }
        public string Path => "api/Service/Room/LoginUser";
    }
}
