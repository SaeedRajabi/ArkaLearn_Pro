using ArkaSoftwarePro.Src.Core.Domain.RoomAggregate.Enumerations;
using Framework.Src.Core.RequestResponse.Commands;
using Framework.Src.Core.RequestResponse.Endpoints;

namespace ArkaSoftwarePro.Src.Core.RequestResponse.Rooms.Commands.UpdateRoom
{
    public class UpdateRoomCommand : ICommand<object>, IWebRequest
    {
        public long RoomId { get; set; }
        public string? Title { get; set; }
        public string? Slug { get; set; }
        public string? BaseUrl { get; set; }
        public int? RoomCapacity { get; set; }
        public bool? IsGuest { get; set; }
        public int? GuestQuantity { get; set; }
        public StatusType? Status { get; set; }
        public int? MaxSessionTime { get; set; }
        public long? DefaultMediaFileId { get; set; }
        public long? DefaultSlideFileId { get; set; }
        public bool? TeacherEntersFirst { get; set; }

        public string Path => "/api/Service/Room/Update";
    }
}
