using ArkaSoftwarePro.Src.Infrastructure.Data.MSSQL.Queries.Entities.Users;

namespace ArkaSoftwarePro.Src.Infrastructure.Data.MSSQL.Queries.Entities.Articles
{
    public class ArticleCommentQueryModel
    {
        public long Id { get; set; }
        public string? CommentText { get; set; }
        public DateTime CreateAt { get; set; }
        public bool IsApproved { get; set; }
        public int Rating { get; set; }
        public int Likes { get; set; }
        public long? ParentId { get; set; }
        public ArticleCommentQueryModel? Parent { get; set; }
        public ICollection<ArticleCommentQueryModel> Replies { get; set; } = new List<ArticleCommentQueryModel>();
        public long ArticleId { get; set; }
        public ArticleQueryModel? Article { get; set; }
        public long? UserId { get; set; }
        public UserQueryModel? User { get; set; }
    }
}
