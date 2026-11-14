namespace ArkaSoftwarePro.Src.Infrastructure.Data.MSSQL.Queries.Entities.Courses
{
    public class CourseFaqQueryModel
    {
        public long Id { get; set; }
        public string? Question { get; set; }
        public string? Answer { get; set; }


        public long CourseQueryModelId { get; set; }
        public CourseQueryModel? CourseQueryModel { get; set; }
    }
}
