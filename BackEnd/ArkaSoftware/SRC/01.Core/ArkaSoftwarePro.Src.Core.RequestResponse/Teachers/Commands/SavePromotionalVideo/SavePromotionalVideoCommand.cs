using Framework.Src.Core.RequestResponse.Commands;
using Framework.Src.Core.RequestResponse.Endpoints;

namespace ArkaSoftwarePro.Src.Core.RequestResponse.Teachers.Commands.SavePromotionalVideo;

public class SavePromotionalVideoCommand : ICommand<string>, IWebRequest
{
    public long VideoId { get; set; }
    public long? TeacherUserId { get; set; }
    public string Title { get; set; } = string.Empty;
    public string VideoUrl { get; set; } = string.Empty;
    public string? ThumbnailUrl { get; set; }
    public int SortOrder { get; set; }
    public int? DurationSeconds { get; set; }
    public string Path => "/api/Service/Teacher/SavePromotionalVideo";
    public string? SeoTitle { get; set; }
    public string? MetaDescription { get; set; }
    public string? OgImageUrl { get; set; }
}
