using Framework.Src.Core.RequestResponse.Endpoints;
using Framework.Src.Core.RequestResponse.Queries;

namespace ArkaSoftwarePro.Src.Core.RequestResponse.UserActivity.Queries.SearchUserActivitySubjects;

public class SearchUserActivitySubjectsQuery : PageQuery<PagedData<UserActivitySubjectListItemQri>>, IWebRequest
{
    public string? Search { get; set; }
    public string Path => "/api/Service/UserActivity/SearchSubjects";
}

public class UserActivitySubjectListItemQri
{
    public string SubjectKey { get; set; } = string.Empty;
    public long? UserId { get; set; }
    public string VisitorKey { get; set; } = string.Empty;
    public string DisplayName { get; set; } = string.Empty;
    public bool IsAnonymous { get; set; }
    public string? LatestIpAddressV4 { get; set; }
    public string? LatestIpAddressV6 { get; set; }
    public string? LatestBrowserName { get; set; }
    public string? LatestOperatingSystem { get; set; }
    public string? LatestDeviceType { get; set; }
    public string? LatestSiteSource { get; set; }
    public DateTime LastActivityAtUtc { get; set; }
    public int EventCount { get; set; }
}
