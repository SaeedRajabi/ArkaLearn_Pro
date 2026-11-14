using Framework.Src.Core.RequestResponse.Commands;
using Framework.Src.Core.RequestResponse.Endpoints;

namespace ArkaSoftwarePro.Src.Core.RequestResponse.UserActivity.Commands.TrackUserActivity;

public class TrackUserActivityCommand : ICommand<string>, IWebRequest
{
    public string VisitorKey { get; set; } = string.Empty;
    public string ActionType { get; set; } = "PageView";
    public string ActionTitle { get; set; } = string.Empty;
    public string PagePath { get; set; } = string.Empty;
    public string? PageTitle { get; set; }
    public string? Referrer { get; set; }
    public string SiteSource { get; set; } = "client";
    public string? MetadataJson { get; set; }
    public string Path => "/api/Service/UserActivity/Track";
}
