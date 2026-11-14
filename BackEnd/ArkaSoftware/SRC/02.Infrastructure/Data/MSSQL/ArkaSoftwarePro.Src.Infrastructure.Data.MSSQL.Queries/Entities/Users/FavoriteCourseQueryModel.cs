using ArkaSoftwarePro.Src.Infrastructure.Data.MSSQL.Queries.Entities.Courses;

namespace ArkaSoftwarePro.Src.Infrastructure.Data.MSSQL.Queries.Entities.Users
{
    public class FavoriteCourseQueryModel
    {
        public long Id { get; set; }
        public long UserId { get; set; }
        public long CourseId { get; set; }
        public DateTime CreatedAt { get; set; }

        public CourseQueryModel? Course { get; set; }
    }
}
