using ArkaSoftwarePro.Src.Core.Domain.RoomAggregate.Enumerations;

namespace ArkaSoftwarePro.Src.Core.RequestResponse.Rooms.Queries.GetRoomWithRoomId
{
    public class GetRoomByRoomIdQri
    {
        public long RoomId { get; set; }
        public string? Title { get; set; }
        public string? Slug { get; set; }
        public int Capacity { get; set; }
        public string? ClassRoomLink { get; set; }
        public bool IsGuest { get; set; }
        public int GuestQuantity { get; set; }
        public bool FirstAdminInput { get; set; }
        public bool TeacherEntersFirst { get; set; }
        public StatusType Status { get; set; }
        public int MaxSessionTime { get; set; }
        public long? DefaultMediaFileId { get; set; }
        public long? DefaultSlideFileId { get; set; }
        public long UserId { get; set; }
        public bool HasLinkedSeminar { get; set; }
        public long? LinkedSeminarId { get; set; }

        /// <summary>Room user (seat) ids allowed to join this room as participants.</summary>
        public List<long> AssignedRoomUserIds { get; set; } = new();

        /// <summary>Catalog <see cref="ManagedRoomStudent"/> ids currently linked to seats in this room.</summary>
        public List<long> AssignedManagedRoomStudentIds { get; set; } = new();

        /// <summary>Per-seat block state for managed catalog students in this room.</summary>
        public List<RoomManagedSeatSummary> ManagedSeatSummaries { get; set; } = new();
    }

}
