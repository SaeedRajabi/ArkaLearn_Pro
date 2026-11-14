namespace ArkaSoftwarePro.Src.Core.RequestResponse.Articles.Queries.GetArticleById
{
    public class ArticleQri
    {
        public long Id { get; set; }
        public string Title { get; set; } = string.Empty;
        public string Summary { get; set; } = string.Empty;
        public string Content { get; set; } = string.Empty;
        public string Slug { get; set; } = string.Empty;
        public string? ThumbnailUrl { get; set; }
        public bool IsPublished { get; set; }
        public string? SeoTitle { get; set; }
        public string? MetaDescription { get; set; }
        public string? OgImageUrl { get; set; }
        public string? PublishedAt { get; set; }
        public long? CategoryId { get; set; }
        public string? CategoryName { get; set; }
        public long AuthorUserId { get; set; }
        public string AuthorAvatarImage { get; set; } = string.Empty;
        public string? AuthorName { get; set; }
        public string CreatedAt { get; set; } = string.Empty;
        public List<string> Tags { get; set; } = new();
    }
}
