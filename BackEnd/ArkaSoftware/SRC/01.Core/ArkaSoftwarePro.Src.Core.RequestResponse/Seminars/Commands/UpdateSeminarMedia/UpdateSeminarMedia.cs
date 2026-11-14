using Framework.Src.Core.RequestResponse.Commands;
using Framework.Src.Core.RequestResponse.Endpoints;

namespace ArkaSoftwarePro.Src.Core.RequestResponse.Seminars.Commands.UpdateSeminarMedia
{
    public class UpdateSeminarMedia : ICommand<string>, IWebRequest
    {
        public long SeminarId { get; set; }
        public string? ThumbnailUrl { get; set; }
        public string? VideoUrl { get; set; }
        public string? RecordingVideoUrl { get; set; }
        /// <summary>intro | recording</summary>
        public string? MediaKind { get; set; }
        public string Path => "/api/Service/Seminar/UploadMedia";
    }
}
