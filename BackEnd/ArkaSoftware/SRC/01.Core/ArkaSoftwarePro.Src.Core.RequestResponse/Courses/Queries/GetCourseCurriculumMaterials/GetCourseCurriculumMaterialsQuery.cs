using Framework.Src.Core.RequestResponse.Endpoints;
using Framework.Src.Core.RequestResponse.Queries;

namespace ArkaSoftwarePro.Src.Core.RequestResponse.Courses.Queries.GetCourseCurriculumMaterials;

public class GetCourseCurriculumMaterialsQuery : IQuery<List<CourseCurriculumMaterialAdminQri>>, IWebRequest
{
    public long CourseId { get; set; }
    public string Path => "/api/Service/CourseMaterial/List";
}

public class CourseCurriculumMaterialAdminQri
{
    public long Id { get; set; }
    public long CourseId { get; set; }
    public long CourseSectionId { get; set; }
    public long? CourseLessonId { get; set; }
    public long MediaAssetId { get; set; }
    public string DisplayName { get; set; } = string.Empty;
    public int SortOrder { get; set; }
    public string? OriginalFileName { get; set; }
    public long? FileSizeBytes { get; set; }
    public bool IsEncrypted { get; set; }
}
