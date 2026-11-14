namespace ArkaSoftwarePro.Src.Infrastructure.Data.MSSQL.Queries.Entities.Rooms
{
    public partial class RoomUserQueryModel
    {
        public long UserId { get; set; }
        public string FirstName { get; set; } = string.Empty;
        public string LastName { get; set; } = string.Empty;
        public string UserName { get; set; } = string.Empty;
        public string? Email { get; set; }
        public string? PhotoUrl { get; set; }
        public long? ManagedRoomStudentId { get; set; }
        public bool IsBlocked { get; set; }
        public bool IsOnline { get; set; }
        public DateTime CreateAt { get; set; }


        public long RoomId { get; set; }
        public RoomQueryModel? Room { get; set; }

    }
}
