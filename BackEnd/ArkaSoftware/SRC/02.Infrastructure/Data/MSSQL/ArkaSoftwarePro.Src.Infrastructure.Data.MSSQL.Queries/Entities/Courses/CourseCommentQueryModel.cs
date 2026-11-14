using ArkaSoftwarePro.Src.Infrastructure.Data.MSSQL.Queries.Entities.Users;

namespace ArkaSoftwarePro.Src.Infrastructure.Data.MSSQL.Queries.Entities.Courses
{
    public class CourseCommentQueryModel
    {
        public long Id { get; set; }
        public string CommentText { get; set; } = string.Empty;
        public DateTime CreateAt { get; set; }
        public bool IsApproved { get; set; }
        public int Rating { get; set; }
        public int Likes { get; set; }
        public long? ParentId { get; set; }
        public CourseCommentQueryModel? Parent { get; set; }

        public ICollection<CourseCommentQueryModel> Replies { get; set; } = new List<CourseCommentQueryModel>();

        public CourseQueryModel Course { get; set; }
        public long CourseId { get; set; }



        public UserQueryModel User { get; set; }
        public long UserId { get; set; }
    }
}
