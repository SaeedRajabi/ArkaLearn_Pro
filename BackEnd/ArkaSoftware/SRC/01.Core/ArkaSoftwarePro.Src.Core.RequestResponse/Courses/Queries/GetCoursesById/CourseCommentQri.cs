namespace ArkaSoftwarePro.Src.Core.RequestResponse.Courses.Queries.GetCoursesById
{
    public class CourseCommentQri
    {
        public long Id { get; set; }
        public string AuthorName { get; set; }
        public string AuthorAvatar { get; set; }
        public int CommentLike { get; set; }
        public string Content { get; set; } = string.Empty;
        public string CreateAt { get; set; } = string.Empty;
    }
}
