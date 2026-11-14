namespace ArkaSoftwarePro.Src.Core.RequestResponse.Projects.Queries.SearchProjects;

public class SearchProjectQri
{
    public long Id { get; set; }
    public string Title { get; set; } = string.Empty;
    public string Slug { get; set; } = string.Empty;
    public string ShortDescription { get; set; } = string.Empty;
    public string? ThumbnailUrl { get; set; }
    public bool IsPublished { get; set; }
    public string? PublishedAt { get; set; }
    public string CreatedAt { get; set; } = string.Empty;
    public List<string> Tags { get; set; } = new();
    public List<string> Technologies { get; set; } = new();
}
