using ArkaSoftwarePro.Src.Infrastructure.Data.MSSQL.Queries.Entities.Tags;
using ArkaSoftwarePro.Src.Infrastructure.Data.MSSQL.Queries.Entities.Users;

namespace ArkaSoftwarePro.Src.Infrastructure.Data.MSSQL.Queries.Entities.Projects;

public class ProjectQueryModel
{
    public long Id { get; set; }
    public string? Title { get; set; }
    public string? Slug { get; set; }
    public string? ShortDescription { get; set; }
    public string? LongDescription { get; set; }
    public string? ThumbnailUrl { get; set; }
    public string? IntroVideoUrl { get; set; }
    public string? GitHubUrl { get; set; }
    public string? ProjectUrl { get; set; }
    public string? TechnologiesJson { get; set; }
    public string? GalleryJson { get; set; }
    public bool IsPublished { get; set; }
    public DateTime? PublishedAt { get; set; }
    public DateTime CreatedDateTime { get; set; }
    public long AuthorUserId { get; set; }
    public string? SeoTitle { get; set; }
    public string? MetaDescription { get; set; }
    public string? OgImageUrl { get; set; }
    public UserQueryModel? AuthorUser { get; set; }
    public List<TagQueryModel> Tags { get; set; } = new();
}
