namespace ArkaSoftwarePro.Src.Core.RequestResponse.Rooms.Queries.GetRoomWithRoomId;

/// <summary>Catalog-linked seat in a room (for admin block/unblock UI).</summary>
public class RoomManagedSeatSummary
{
    public long RoomUserId { get; set; }

    public long ManagedRoomStudentId { get; set; }

    public bool IsBlocked { get; set; }
}
