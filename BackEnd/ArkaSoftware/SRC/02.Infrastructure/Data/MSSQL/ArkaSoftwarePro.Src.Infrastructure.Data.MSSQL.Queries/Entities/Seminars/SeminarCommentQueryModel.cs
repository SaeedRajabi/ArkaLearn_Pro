using ArkaSoftwarePro.Src.Infrastructure.Data.MSSQL.Queries.Entities.Users;

namespace ArkaSoftwarePro.Src.Infrastructure.Data.MSSQL.Queries.Entities.Seminars
{
    public class SeminarCommentQueryModel
    {
        public long Id { get; set; }
        public string? CommentText { get; set; }
        public DateTime CreateAt { get; set; }
        public bool IsApproved { get; set; }
        public int Rating { get; set; }
        public int Likes { get; set; }
        public long? ParentId { get; set; }
        public SeminarCommentQueryModel? Parent { get; set; }
        public ICollection<SeminarCommentQueryModel> Replies { get; set; } = new List<SeminarCommentQueryModel>();
        public long SeminarId { get; set; }
        public SeminarQueryModel? Seminar { get; set; }
        public long? UserId { get; set; }
        public UserQueryModel? User { get; set; }
    }
}
