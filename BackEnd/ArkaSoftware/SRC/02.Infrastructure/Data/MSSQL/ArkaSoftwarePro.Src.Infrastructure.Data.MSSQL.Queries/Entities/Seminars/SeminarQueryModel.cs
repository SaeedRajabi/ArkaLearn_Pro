using ArkaSoftwarePro.Src.Infrastructure.Data.MSSQL.Queries.Entities.Rooms;
using ArkaSoftwarePro.Src.Infrastructure.Data.MSSQL.Queries.Entities.Tags;

namespace ArkaSoftwarePro.Src.Infrastructure.Data.MSSQL.Queries.Entities.Seminars
{
    public class SeminarQueryModel
    {
        public long Id { get; set; }
        public string? Title { get; set; }
        public string? Description { get; set; }
        public DateTime StartTime { get; set; }
        public DateTime EndTime { get; set; }
        public int Capacity { get; set; }
        public decimal? Price { get; set; }
        public bool IsFree { get; set; }
        public byte Status { get; set; }
        public string? EntryLink { get; set; }
        public string? ThumbnailUrl { get; set; }
        public string? VideoUrl { get; set; }
        public string? RecordingVideoUrl { get; set; }
        public bool IsPublic { get; set; } = true;
        public string? Prerequisites { get; set; }
        public string? FaqsJson { get; set; }
        public long? RoomId { get; set; }
        public string? SeoTitle { get; set; }
        public string? MetaDescription { get; set; }
        public string? OgImageUrl { get; set; }
        public RoomQueryModel? Room { get; set; }
        public List<TagQueryModel> Tags { get; set; } = new();
        public List<SeminarRegistrationQueryModel> Registrations { get; set; } = new();
        public List<SeminarCommentQueryModel> Comments { get; set; } = new();
    }
}
