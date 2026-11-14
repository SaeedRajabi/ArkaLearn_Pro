using ArkaSoftwarePro.Src.Core.Domain.RoomAggregate.Enumerations;

namespace ArkaSoftwarePro.Src.Core.RequestResponse.Rooms.Queries.GetRoomFilesByRoomId
{
    public class GetRoomFilesByRoomIdQri
    {
        public long Id { get; set; }
        public long RoomId { get; set; }
        public RoomFileType FileType { get; set; }
        public string Title { get; set; } = string.Empty;
        public string? Description { get; set; }
        public string FileName { get; set; } = string.Empty;
        public string FileUrl { get; set; } = string.Empty;
        public long FileSize { get; set; }
        public string? UploadedByUserId { get; set; }
    }
}
