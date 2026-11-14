using ArkaSoftwarePro.Src.Core.Domain.RoomAggregate.Enumerations;
using ArkaSoftwarePro.Src.Infrastructure.Data.MSSQL.Queries.Entities.Users;

namespace ArkaSoftwarePro.Src.Infrastructure.Data.MSSQL.Queries.Entities.Rooms
{
    public partial class RoomQueryModel
    {
        public long RoomId { get; set; }
        public string? Slug { get; set; }
        public int Capacity { get; set; }
        public string ClassRoomLink { get; set; } = string.Empty;
        public bool FirstAdminInput { get; set; }
        public bool TeacherEntersFirst { get; set; }
        public int GuestQuantity { get; set; }
        public bool IsGuest { get; set; }
        public int MaxSessionTime { get; set; }
        public string? Title { get; set; }
        public StatusType Status { get; set; }
        public long? DefaultMediaFileId { get; set; }
        public long? DefaultSlideFileId { get; set; }
        public long UserId { get; set; }
        public UserQueryModel? User { get; set; }
        public List<MessageQueryModel> Messages { get; set; } = new List<MessageQueryModel>();
        public List<RoomUserQueryModel> RoomUsers { get; set; } = new List<RoomUserQueryModel>();

    }
}
