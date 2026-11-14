using ArkaSoftwarePro.Src.Infrastructure.Data.MSSQL.Queries.Entities.Seminars;

namespace ArkaSoftwarePro.Src.Infrastructure.Data.MSSQL.Queries.Entities.Users
{
    public class FavoriteSeminarQueryModel
    {
        public long Id { get; set; }
        public long UserId { get; set; }
        public long SeminarId { get; set; }
        public DateTime CreatedAt { get; set; }

        public SeminarQueryModel? Seminar { get; set; }
    }
}
