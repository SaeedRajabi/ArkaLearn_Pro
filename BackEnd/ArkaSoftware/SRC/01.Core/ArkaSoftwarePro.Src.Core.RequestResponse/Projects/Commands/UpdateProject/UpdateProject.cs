using ArkaSoftwarePro.Src.Core.Domain.Caching;
using Framework.Src.Core.RequestResponse.Commands;
using Framework.Src.Core.RequestResponse.Endpoints;

namespace ArkaSoftwarePro.Src.Core.RequestResponse.Projects.Commands.UpdateProject;

[InvalidatesCache(CacheRegion.Projects)]
public class UpdateProject : ICommand<string>, IWebRequest
{
    public long Id { get; set; }
    public string Title { get; set; } = string.Empty;
    public string Slug { get; set; } = string.Empty;
    public string ShortDescription { get; set; } = string.Empty;
    public string LongDescription { get; set; } = string.Empty;
    public string? ThumbnailUrl { get; set; }
    public string? IntroVideoUrl { get; set; }
    public string? GitHubUrl { get; set; }
    public string? ProjectUrl { get; set; }
    public string? TechnologiesJson { get; set; }
    public string? GalleryJson { get; set; }
    public string? TagsJson { get; set; }
    public bool IsPublished { get; set; }
    public string Path => "/api/Service/Project/Update";
    public string? SeoTitle { get; set; }
    public string? MetaDescription { get; set; }
    public string? OgImageUrl { get; set; }
}
