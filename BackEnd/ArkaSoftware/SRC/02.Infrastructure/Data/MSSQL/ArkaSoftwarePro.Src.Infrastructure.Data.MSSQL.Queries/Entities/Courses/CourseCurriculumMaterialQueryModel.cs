namespace ArkaSoftwarePro.Src.Infrastructure.Data.MSSQL.Queries.Entities.Courses;

public class CourseCurriculumMaterialQueryModel
{
    public long Id { get; set; }
    public long CourseId { get; set; }
    public long CourseSectionId { get; set; }
    public long? CourseLessonId { get; set; }
    public long MediaAssetId { get; set; }
    public string DisplayName { get; set; } = string.Empty;
    public int SortOrder { get; set; }
    public bool IsDelete { get; set; }
}
