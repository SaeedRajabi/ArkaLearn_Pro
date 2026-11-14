namespace ArkaSoftwarePro.Src.Infrastructure.Data.MSSQL.Queries.Entities.Courses
{
    public class CourseVideoQueryModel
    {
        public long Id { get;  set; }
        public string? Title { get; set; }
        public string? VideoPath { get; set; }
        public TimeSpan Duration { get; set; }

        public long? CourseId { get; set; }
        public CourseQueryModel? Course { get; set; }
    }
}
