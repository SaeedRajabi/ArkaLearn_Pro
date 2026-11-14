using ArkaSoftwarePro.Src.Infrastructure.Data.MSSQL.Queries.Entities.Categories;
using ArkaSoftwarePro.Src.Infrastructure.Data.MSSQL.Queries.Entities.Tags;
using ArkaSoftwarePro.Src.Infrastructure.Data.MSSQL.Queries.Entities.Users;

namespace ArkaSoftwarePro.Src.Infrastructure.Data.MSSQL.Queries.Entities.Articles
{
    public class ArticleQueryModel
    {
        public long Id { get; set; }
        public string? Title { get; set; }
        public string? Summary { get; set; }
        public string? Content { get; set; }
        public string? Slug { get; set; }
        public string? ThumbnailUrl { get; set; }
        public string? SeoTitle { get; set; }
        public string? MetaDescription { get; set; }
        public string? OgImageUrl { get; set; }
        public bool IsPublished { get; set; }
        public DateTime? PublishedAt { get; set; }
        public byte ModerationStatus { get; set; }
        public string? ModerationRejectionNote { get; set; }
        public DateTime? ModerationSubmittedAtUtc { get; set; }
        public DateTime CreatedDateTime { get; set; }
        public long? CategoryId { get; set; }
        public CategoryQueryModel? Category { get; set; }
        public long AuthorUserId { get; set; }
        public UserQueryModel? AuthorUser { get; set; }
        public List<ArticleCommentQueryModel> Comments { get; set; } = new();
        public List<TagQueryModel> Tags { get; set; } = new();
    }
}
