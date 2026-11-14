namespace ArkaSoftwarePro.Src.Core.RequestResponse.Articles.Queries.SearchArticles
{
    public class SearchArticleQri
    {
        public long Id { get; set; }
        public string Title { get; set; } = string.Empty;
        public string Summary { get; set; } = string.Empty;
        public string Slug { get; set; } = string.Empty;
        public string? ThumbnailUrl { get; set; }
        public bool IsPublished { get; set; }
        public string? PublishedAt { get; set; }
        public string? CategoryName { get; set; }
        public long? CategoryId { get; set; }
        public string CreatedAt { get; set; } = string.Empty;
        public List<string> Tags { get; set; } = new();
        public int LikeCount { get; set; }
        public int CommentCount { get; set; }
        public double AverageRating { get; set; }
        public string? AuthorName { get; set; }
    }
}
