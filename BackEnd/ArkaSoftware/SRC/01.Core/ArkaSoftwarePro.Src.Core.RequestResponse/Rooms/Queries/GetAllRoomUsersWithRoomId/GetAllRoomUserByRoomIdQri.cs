namespace ArkaSoftwarePro.Src.Core.RequestResponse.Rooms.Queries.GetAllRoomUsersWithRoomId
{
    public class GetAllRoomUserByRoomIdQri
    {
        public long RoomUserId { get; set; }
        public long UserId { get; set; }
        public long ManagedRoomStudentId { get; set; }
        public string FullName { get; set; } = string.Empty;
        public string UserName { get; set; } = string.Empty;
        public string CreateAt { get; set; } = string.Empty;
        public bool IsMute { get; set; } = false;
        public bool IsOnline { get; set; }
        public bool IsBlocked { get; set; }
    }
}
