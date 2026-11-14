namespace ArkaSoftwarePro.Src.Core.RequestResponse.Articles.Queries.GetMyFavoriteArticles
{
    public class GetMyFavoriteArticleQri
    {
        public long Id { get; set; }
        public string Title { get; set; } = string.Empty;
        public string Summary { get; set; } = string.Empty;
        public string Slug { get; set; } = string.Empty;
        public string? ThumbnailUrl { get; set; }
        public bool IsPublished { get; set; }
        public string? PublishedAt { get; set; }
        public string? CategoryName { get; set; }
        public string CreatedAt { get; set; } = string.Empty;
    }
}
