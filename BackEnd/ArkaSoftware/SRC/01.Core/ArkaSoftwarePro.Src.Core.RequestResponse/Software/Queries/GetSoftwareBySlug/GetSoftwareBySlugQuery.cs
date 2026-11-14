using ArkaSoftwarePro.Src.Core.Domain.Caching;
using Framework.Src.Core.RequestResponse.Endpoints;
using Framework.Src.Core.RequestResponse.Queries;

namespace ArkaSoftwarePro.Src.Core.RequestResponse.Software.Queries.GetSoftwareBySlug;

[CacheableQuery(CacheRegion.Software)]
public class GetSoftwareBySlugQuery : IQuery<SoftwarePublicQri?>, IWebRequest
{
    public string Slug { get; set; } = string.Empty;
    public string Path => "/api/Service/Software/GetBySlug";
}

public class SoftwarePublicQri
{
    public long Id { get; set; }
    public long? TeacherId { get; set; }
    public string Title { get; set; } = string.Empty;
    public string ShortDescription { get; set; } = string.Empty;
    public string LongDescriptionHtml { get; set; } = string.Empty;
    public string? CoverImageUrl { get; set; }
    public string? InstallerFileUrl { get; set; }
    public string? InstallerFileName { get; set; }
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
    public string? SeoTitle { get; set; }
    public string? MetaDescription { get; set; }
    public string? OgImageUrl { get; set; }
}
