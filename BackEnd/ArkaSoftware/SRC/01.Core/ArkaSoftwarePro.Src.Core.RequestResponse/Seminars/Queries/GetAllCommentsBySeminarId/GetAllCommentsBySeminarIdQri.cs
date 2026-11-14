namespace ArkaSoftwarePro.Src.Core.RequestResponse.Seminars.Queries.GetAllCommentsBySeminarId
{
    public class GetAllCommentsBySeminarIdQri
    {
        public long Id { get; set; }
        public int Rating { get; set; }
        public string Text { get; set; } = string.Empty;
        public int Likes { get; set; }
        public bool IsApproved { get; set; }
        public string TimeStamp { get; set; } = string.Empty;
        public SeminarCommentAuthorQri? Author { get; set; }
        public long? ParentId { get; set; }
        public ICollection<GetAllCommentsBySeminarIdQri> Replies { get; set; } = new List<GetAllCommentsBySeminarIdQri>();
    }

    public class SeminarCommentAuthorQri
    {
        public long Id { get; set; }
        public string FullName { get; set; } = string.Empty;
        public string UserName { get; set; } = string.Empty;
        public string AvatarUrl { get; set; } = string.Empty;
    }
}
