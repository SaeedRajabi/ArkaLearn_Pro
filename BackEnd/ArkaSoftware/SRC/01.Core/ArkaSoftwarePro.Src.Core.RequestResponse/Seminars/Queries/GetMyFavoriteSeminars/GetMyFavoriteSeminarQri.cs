namespace ArkaSoftwarePro.Src.Core.RequestResponse.Seminars.Queries.GetMyFavoriteSeminars
{
    public class GetMyFavoriteSeminarQri
    {
        public long Id { get; set; }
        public string Title { get; set; } = string.Empty;
        public string? Description { get; set; }
        public DateTime StartTime { get; set; }
        public DateTime EndTime { get; set; }
        public int Capacity { get; set; }
        public int RegisteredCount { get; set; }
        public decimal Price { get; set; }
        public bool IsFree { get; set; }
        public int Status { get; set; }
        public string? ThumbnailUrl { get; set; }
        public long? RoomId { get; set; }
        public string? RoomTitle { get; set; }
    }
}
