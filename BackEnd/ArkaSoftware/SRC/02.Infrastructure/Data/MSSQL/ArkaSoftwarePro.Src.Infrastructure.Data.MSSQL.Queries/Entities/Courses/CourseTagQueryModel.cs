namespace ArkaSoftwarePro.Src.Infrastructure.Data.MSSQL.Queries.Entities.Courses;

public class CourseTagQueryModel
{
    public string TagName { get; set; } = string.Empty;

    public CourseQueryModel Course { get; set; }
    public long CourseId { get; set; }
}