using Framework.Src.Core.RequestResponse.Commands;
using Framework.Src.Core.RequestResponse.Endpoints;
using Microsoft.AspNetCore.Http;

namespace ArkaSoftwarePro.Src.Core.RequestResponse.Rooms.Commands.UpdateRoomFile
{
    public class UpdateRoomFileCommand : ICommand<object>, IWebRequest
    {
        public long RoomId { get; set; }
        public int FileType { get; set; }
        public string Title { get; set; } = string.Empty;
        public string? Description { get; set; }
        public IFormFile? File { get; set; }

        public string Path => "api/Service/Room/UpdateRoomFile";
    }
}
