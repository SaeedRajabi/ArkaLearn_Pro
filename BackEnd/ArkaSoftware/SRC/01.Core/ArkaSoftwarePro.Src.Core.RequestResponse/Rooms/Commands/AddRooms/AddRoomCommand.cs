using ArkaSoftwarePro.Src.Core.Domain.RoomAggregate.Enumerations;
using Framework.Src.Core.RequestResponse.Commands;
using Framework.Src.Core.RequestResponse.Endpoints;
namespace ArkaSoftwarePro.Src.Core.RequestResponse.Rooms.Commands.AddRooms
{
    public class AddRoomCommand : ICommand<object>, IWebRequest
    {
        public string? Title { get; set; }
        /// <summary>URL segment for room (e.g. my-class). Link will be BaseUrl + "/" + Slug.</summary>
        public string? Slug { get; set; }
        /// <summary>Base URL for room links (e.g. https://example.com/room).</summary>
        public string? BaseUrl { get; set; }
        public int RoomCapacity { get; set; }
        public bool IsGuest { get; set; }
        public int GuestQuantity { get; set; }
        public bool FirstAdminInput { get; set; }
        public bool TeacherEntersFirst { get; set; }
        public StatusType Status { get; set; }
        public int MaxSessionTime { get; set; }
        public long UserId { get; set; }

        public string Path => "/api/Service/Room/Add";
    }
}
