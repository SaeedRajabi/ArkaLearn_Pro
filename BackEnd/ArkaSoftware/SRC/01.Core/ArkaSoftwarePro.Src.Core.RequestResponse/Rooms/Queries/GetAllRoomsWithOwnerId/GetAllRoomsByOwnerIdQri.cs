namespace ArkaSoftwarePro.Src.Core.RequestResponse.Rooms.Queries.GetAllRoomsWithOwnerId
{
    public class GetAllRoomsByOwnerIdQri
    {
        public long RoomId { get; set; }
        public string Title { get; set; } = string.Empty;
        public string? Slug { get; set; }
        public string ServiceName { get; set; } = string.Empty;
        public string Status { get; set; } = string.Empty;
    }
}
