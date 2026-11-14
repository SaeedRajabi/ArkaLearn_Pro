namespace ArkaSoftwarePro.Src.Core.RequestResponse.Courses.Queries.GetAllCommentsByCourseId
{
    public class GetAllCommentsByCourseIdQri
    {
        public long Id { get; set; }
        public int Rating { get; set; }
        public string Text { get; set; } = string.Empty;
        public int Likes { get; set; }
        public bool IsApproved { get; set; }
        public string TimeStamp { get; set; } = string.Empty;
        public CommentAuthorQri? Author { get; set; }
        public long? ParentId { get; set; }
        public ICollection<GetAllCommentsByCourseIdQri> Replies { get; set; } = new  List<GetAllCommentsByCourseIdQri>();
    }
}
