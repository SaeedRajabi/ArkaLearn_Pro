namespace ArkaSoftwarePro.Src.Core.RequestResponse.Articles.Queries.GetAllCommentsByArticleId
{
    public class GetAllCommentsByArticleIdQri
    {
        public long Id { get; set; }
        public long ArticleId { get; set; }
        public string? ArticleTitle { get; set; }
        public int Rating { get; set; }
        public string Text { get; set; } = string.Empty;
        public int Likes { get; set; }
        public bool IsApproved { get; set; }
        public string TimeStamp { get; set; } = string.Empty;
        public CommentAuthorQri? Author { get; set; }
        public long? ParentId { get; set; }
        public ICollection<GetAllCommentsByArticleIdQri> Replies { get; set; } = new List<GetAllCommentsByArticleIdQri>();
    }

    public class CommentAuthorQri
    {
        public long Id { get; set; }
        public string FullName { get; set; } = string.Empty;
        public string UserName { get; set; } = string.Empty;
        public string AvatarUrl { get; set; } = string.Empty;
    }
}
