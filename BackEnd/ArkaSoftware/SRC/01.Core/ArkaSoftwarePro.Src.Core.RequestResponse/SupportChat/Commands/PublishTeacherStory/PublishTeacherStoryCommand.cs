using Framework.Src.Core.RequestResponse.Commands;
using Framework.Src.Core.RequestResponse.Endpoints;

namespace ArkaSoftwarePro.Src.Core.RequestResponse.SupportChat.Commands.PublishTeacherStory;

public class PublishTeacherStoryCommand : ICommand<long>, IWebRequest
{
    public long UserId { get; set; }
    public string Caption { get; set; } = string.Empty;
    public string? MediaUrl { get; set; }
    public string? ThumbnailUrl { get; set; }
    /// <summary>0=None, 1=Image, 2=Video</summary>
    public int MediaKind { get; set; }
    public int? DurationSeconds { get; set; }
    public string Path => "/api/Service/SupportChat/PublishStory";
}
