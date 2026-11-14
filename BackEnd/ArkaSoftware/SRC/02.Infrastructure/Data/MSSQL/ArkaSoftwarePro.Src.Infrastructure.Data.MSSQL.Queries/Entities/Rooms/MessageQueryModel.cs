namespace ArkaSoftwarePro.Src.Infrastructure.Data.MSSQL.Queries.Entities.Rooms
{
    public partial class MessageQueryModel
    {
        public long MessageId { get; set; }
        public string SenderId { get; set; } = string.Empty;
        public string MessageText { get; set; } = string.Empty;
        public DateTime SendAt {get; set;}

        public long RoomId { get; set; }
        public RoomQueryModel? Room { get; set; }

    }
}
