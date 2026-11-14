namespace ArkaSoftwarePro.Src.Infrastructure.Data.MSSQL.Queries.Entities.Courses;

public class CourseDependencyQueryModel
{
    public long Id { get; set; }
    public long CourseId { get; set; }
    public string DependencyTitle { get; set; } = string.Empty;
    public bool IsDelete { get; set; }
}
