using ArkaSoftwarePro.Src.Infrastructure.Data.MSSQL.Queries.Entities.Users;

namespace ArkaSoftwarePro.Src.Infrastructure.Data.MSSQL.Queries.Entities.Seminars
{
    public class SeminarRegistrationQueryModel
    {
        public long Id { get; set; }
        public long UserId { get; set; }
        public long SeminarId { get; set; }
        public bool HasPaid { get; set; }
        public DateTime RegisteredAt { get; set; }
        public SeminarQueryModel? Seminar { get; set; }
        public UserQueryModel? User { get; set; }
    }
}
