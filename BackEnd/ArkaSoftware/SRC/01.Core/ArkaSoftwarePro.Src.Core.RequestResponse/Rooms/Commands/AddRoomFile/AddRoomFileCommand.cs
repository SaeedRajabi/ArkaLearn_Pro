using ArkaSoftwarePro.Src.Core.Domain.RoomAggregate.Enumerations;
using Framework.Src.Core.RequestResponse.Commands;
using Framework.Src.Core.RequestResponse.Endpoints;

namespace ArkaSoftwarePro.Src.Core.RequestResponse.Rooms.Commands.AddRoomFile
{
    public class AddRoomFileCommand : ICommand<object>, IWebRequest
    {
        public long RoomId { get; set; }
        public RoomFileType FileType { get; set; }
        public string Title { get; set; } = string.Empty;
        public string? Description { get; set; }
        public string FileName { get; set; } = string.Empty;
        public string FileUrl { get; set; } = string.Empty;
        public long FileSize { get; set; }
        public string? UploadedByUserId { get; set; }

        public string Path => "/api/Service/Room/AddFile";
    }
}
