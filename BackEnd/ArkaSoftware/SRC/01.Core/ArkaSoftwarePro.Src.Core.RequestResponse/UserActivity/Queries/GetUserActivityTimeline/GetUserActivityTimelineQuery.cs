using Framework.Src.Core.RequestResponse.Endpoints;
using Framework.Src.Core.RequestResponse.Queries;

namespace ArkaSoftwarePro.Src.Core.RequestResponse.UserActivity.Queries.GetUserActivityTimeline;

public class GetUserActivityTimelineQuery : IQuery<UserActivityTimelineQri>, IWebRequest
{
    public string SubjectKey { get; set; } = string.Empty;
    public DateTime? FromUtc { get; set; }
    public DateTime? ToUtc { get; set; }
    public string Path => "/api/Service/UserActivity/GetTimeline";
}

public class UserActivityTimelineQri
{
    public string SubjectKey { get; set; } = string.Empty;
    public string DisplayName { get; set; } = string.Empty;
    public bool IsAnonymous { get; set; }
    public DateTime? SelectedDayUtc { get; set; }
    public List<UserActivityTimelineItemQri> Items { get; set; } = [];
}

public class UserActivityTimelineItemQri
{
    public long Id { get; set; }
    public string ActionType { get; set; } = string.Empty;
    public string ActionTitle { get; set; } = string.Empty;
    public string PagePath { get; set; } = string.Empty;
    public string? PageTitle { get; set; }
    public string? Referrer { get; set; }
    public string SiteSource { get; set; } = string.Empty;
    public string? IpAddressV4 { get; set; }
    public string? IpAddressV6 { get; set; }
    public string? BrowserName { get; set; }
    public string? BrowserVersion { get; set; }
    public string? OperatingSystem { get; set; }
    public string? DeviceType { get; set; }
    public string? UserAgent { get; set; }
    public string DisplayName { get; set; } = string.Empty;
    public DateTime OccurredAtUtc { get; set; }
    public string? MetadataJson { get; set; }
    public bool IsBuffered { get; set; }
}
