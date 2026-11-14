using ArkaSoftwarePro.Src.Core.Domain.CategoryAggregate.Entities;
using ArkaSoftwarePro.Src.Core.Domain.CoursesAggregate.ValueOBJs;
using Framework.Src.Core.Domain.Entities;

namespace ArkaSoftwarePro.Src.Core.Domain.CoursesAggregate.Entities
{
    public class CourseComment : Entity
    {
        #region Properties
        public CommentContent? Content { get; private set; }
        public int Rating { get; private set; }

        public int Like { get; private set; }
        public bool IsApproved { get; private set; }
        #endregion

        #region References Properties
        public long? UserId { get; private set; }
        public long? CourseId { get; private set; }

        public long? ParentId { get; set; }
        public CourseComment? Parent { get; set; }
        public IReadOnlyList<CourseComment> Replies => _replies;
        private List<CourseComment> _replies = new List<CourseComment>();
        #endregion

        #region CTORs
        private CourseComment() { }
        public CourseComment(long? userId, long? courseId, CommentContent content,int rating , int like,long? parentId = 0)
        {
            UserId = userId;
            CourseId = courseId;
            Content = content;
            Rating = rating;
            Like = like;
            IsApproved = false;

            ParentId = parentId == 0 ? null : parentId;
        }
        #endregion

        #region Behaviors IMP

        public static CourseComment Create(long userId, long courseId, CommentContent content, int rating, int like, long? parentId = 0)
            => new CourseComment(userId, courseId, content,rating,like,parentId);
        public bool IsApprovedChecked()
        {
            return IsApproved;
        }
        public void ChangeIsApproved(bool isApproved)
        {
            IsApproved = isApproved;
        }
        public void ChangeApproved(bool isApproved)
        {
            IsApproved = isApproved;
        }
        public void ChangeContent(CommentContent content)
        {
            Content = content;
        }
        public void CommentLike()
        {
            Like++;
        }
        #endregion

    }
}
