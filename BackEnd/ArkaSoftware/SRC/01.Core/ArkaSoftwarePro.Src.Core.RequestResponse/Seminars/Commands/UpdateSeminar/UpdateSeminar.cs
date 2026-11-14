using ArkaSoftwarePro.Src.Core.Domain.Caching;
using Framework.Src.Core.RequestResponse.Commands;
using Framework.Src.Core.RequestResponse.Endpoints;

namespace ArkaSoftwarePro.Src.Core.RequestResponse.Seminars.Commands.UpdateSeminar
{
    [InvalidatesCache(CacheRegion.Seminars)]
    public class UpdateSeminar : ICommand<string>, IWebRequest
    {
        public long Id { get; set; }
        public string Title { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public DateTime StartTime { get; set; }
        public DateTime EndTime { get; set; }
        public int Capacity { get; set; }
        public decimal Price { get; set; }
        public bool IsFree { get; set; }
        public string? EntryLink { get; set; }
        public string? ThumbnailUrl { get; set; }
        public string? VideoUrl { get; set; }
        public string? RecordingVideoUrl { get; set; }
        public bool IsPublic { get; set; } = true;
        public string? TagsJson { get; set; }
        public string? Prerequisites { get; set; }
        public string? FaqsJson { get; set; }
        /// <summary>شناسه اتاق گفتگو آنلاین (اختیاری)</summary>
        public long? RoomId { get; set; }
        public byte Status { get; set; }
        public string Path => "/api/Service/Seminar/Update";
        public string? SeoTitle { get; set; }
        public string? MetaDescription { get; set; }
        public string? OgImageUrl { get; set; }
    }
}
