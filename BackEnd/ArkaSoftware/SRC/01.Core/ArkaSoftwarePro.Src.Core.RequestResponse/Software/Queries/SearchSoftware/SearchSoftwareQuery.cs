using ArkaSoftwarePro.Src.Core.Domain.Caching;
using Framework.Src.Core.RequestResponse.Endpoints;
using Framework.Src.Core.RequestResponse.Queries;

namespace ArkaSoftwarePro.Src.Core.RequestResponse.Software.Queries.SearchSoftware;

[CacheableQuery(CacheRegion.Software)]
public class SearchSoftwareQuery : PageQuery<PagedData<SoftwareListItemQri>>, IWebRequest
{
    public string Search { get; set; } = string.Empty;
    public string? Tag { get; set; }
    public long? CategoryId { get; set; }
    public long? TeacherId { get; set; }
    public bool ForEdit { get; set; }
    public bool PlatformOnly { get; set; }
    public string Path => "/api/Service/Software/Search";
}

public class SoftwareListItemQri
{
    public long Id { get; set; }
    public long? TeacherId { get; set; }
    public string Title { get; set; } = string.Empty;
    public string ShortDescription { get; set; } = string.Empty;
    public string? CoverImageUrl { get; set; }
    public long? CategoryId { get; set; }
    public string? CategoryName { get; set; }
    public List<string> CategoryPath { get; set; } = [];
    public string Slug { get; set; } = string.Empty;
    public List<string> Tags { get; set; } = [];
    public int DownloadCount { get; set; }
    public int LikeCount { get; set; }
    public bool IsLikedByViewer { get; set; }
    public bool IsPlatformOwned { get; set; }
    public string ApprovalStatus { get; set; } = string.Empty;
    public string? TeacherDisplayName { get; set; }
    public string? TeacherUserName { get; set; }
    public string? TeacherAvatarUrl { get; set; }
}
