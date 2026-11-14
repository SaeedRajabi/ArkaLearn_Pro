namespace ArkaSoftwarePro.Src.Core.RequestResponse.Projects.Queries.GetProjectById;

public class ProjectGalleryItemQri
{
    public string Title { get; set; } = string.Empty;
    public string ShortDescription { get; set; } = string.Empty;
    public string ImageUrl { get; set; } = string.Empty;
    public int SortOrder { get; set; }
}

public class ProjectQri
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
    public List<string> Technologies { get; set; } = new();
    public List<ProjectGalleryItemQri> Gallery { get; set; } = new();
    public bool IsPublished { get; set; }
    public string? PublishedAt { get; set; }
    public long AuthorUserId { get; set; }
    public string? AuthorName { get; set; }
    public string CreatedAt { get; set; } = string.Empty;
    public List<string> Tags { get; set; } = new();
    public string? SeoTitle { get; set; }
    public string? MetaDescription { get; set; }
    public string? OgImageUrl { get; set; }
}
