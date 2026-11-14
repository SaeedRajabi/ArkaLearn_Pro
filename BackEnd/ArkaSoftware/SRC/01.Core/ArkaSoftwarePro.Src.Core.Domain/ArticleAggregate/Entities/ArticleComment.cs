using ArkaSoftwarePro.Src.Core.Domain.CoursesAggregate.ValueOBJs;
using Framework.Src.Core.Domain.Entities;

namespace ArkaSoftwarePro.Src.Core.Domain.ArticleAggregate.Entities
{
    public class ArticleComment : Entity
    {
        public CommentContent? Content { get; private set; }
        public int Rating { get; private set; }
        public int Like { get; private set; }
        public bool IsApproved { get; private set; }

        public long? UserId { get; private set; }
        public long? ArticleId { get; private set; }
        public long? ParentId { get; private set; }
        public ArticleComment? Parent { get; private set; }
        public IReadOnlyList<ArticleComment> Replies => _replies;
        private readonly List<ArticleComment> _replies = new();

        private ArticleComment() { }

        public ArticleComment(long? userId, long? articleId, CommentContent content, int rating, int like, long? parentId = null)
        {
            UserId = userId;
            ArticleId = articleId;
            Content = content;
            Rating = rating;
            Like = like;
            IsApproved = false;
            ParentId = parentId == 0 ? null : parentId;
        }

        public static ArticleComment Create(long userId, long articleId, CommentContent content, int rating, int like, long? parentId = null)
            => new ArticleComment(userId, articleId, content, rating, like, parentId);

        public void ChangeApproved(bool isApproved) => IsApproved = isApproved;
        public void ChangeContent(CommentContent content) => Content = content;
        public void CommentLike() => Like++;
    }
}
