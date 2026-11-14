namespace ArkaSoftwarePro.Src.Infrastructure.Data.MSSQL.Queries.Entities.Courses;

public class CourseSectionQueryModel
{
    public long Id { get; set; }
    public string? SessionName { get; set; }

    public CourseQueryModel? Course { get; set; }
    public long CourseId { get; set; }

    public List<CourseLessonQueryModel> Lessons { get; set; } = new List<CourseLessonQueryModel>();
}