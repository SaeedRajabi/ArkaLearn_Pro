using Framework.Src.Core.RequestResponse.Commands;
using Framework.Src.Core.RequestResponse.Endpoints;
using System.Text.Json.Serialization;

namespace ArkaSoftwarePro.Src.Core.RequestResponse.Rooms.Commands.UpdateUserStatus
{
    public class UpdateUserStatusCommand:ICommand<bool> , IWebRequest
    {
        public long UserId { get; set; }
        public long RoomId { get; set; }
        public bool IsOnline { get; set; }
        public string Path => "/api/Service/Room/User/UpdateStatus";
    }
}
