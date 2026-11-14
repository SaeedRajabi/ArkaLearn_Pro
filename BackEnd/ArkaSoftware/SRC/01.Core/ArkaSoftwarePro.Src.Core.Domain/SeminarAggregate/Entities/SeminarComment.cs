using ArkaSoftwarePro.Src.Core.Domain.CoursesAggregate.ValueOBJs;
using Framework.Src.Core.Domain.Entities;

namespace ArkaSoftwarePro.Src.Core.Domain.SeminarAggregate.Entities
{
    public class SeminarComment : Entity
    {
        public CommentContent? Content { get; private set; }
        public int Rating { get; private set; }
        public int Like { get; private set; }
        public bool IsApproved { get; private set; }

        public long? UserId { get; private set; }
        public long? SeminarId { get; private set; }
        public long? ParentId { get; private set; }
        public SeminarComment? Parent { get; private set; }
        public IReadOnlyList<SeminarComment> Replies => _replies;
        private readonly List<SeminarComment> _replies = new();

        private SeminarComment() { }

        public SeminarComment(long? userId, long? seminarId, CommentContent content, int rating, int like, long? parentId = null)
        {
            UserId = userId;
            SeminarId = seminarId;
            Content = content;
            Rating = rating;
            Like = like;
            IsApproved = false;
            ParentId = parentId == 0 ? null : parentId;
        }

        public static SeminarComment Create(long userId, long seminarId, CommentContent content, int rating, int like, long? parentId = null)
            => new SeminarComment(userId, seminarId, content, rating, like, parentId);

        public void ChangeApproved(bool isApproved) => IsApproved = isApproved;
        public void ChangeContent(CommentContent content) => Content = content;
        public void CommentLike() => Like++;
    }
}
