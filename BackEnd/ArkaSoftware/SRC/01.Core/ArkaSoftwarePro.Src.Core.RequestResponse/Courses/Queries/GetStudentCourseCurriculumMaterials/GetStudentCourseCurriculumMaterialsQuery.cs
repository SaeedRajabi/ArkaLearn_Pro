using Framework.Src.Core.RequestResponse.Endpoints;
using Framework.Src.Core.RequestResponse.Queries;

namespace ArkaSoftwarePro.Src.Core.RequestResponse.Courses.Queries.GetStudentCourseCurriculumMaterials;

public class GetStudentCourseCurriculumMaterialsQuery
    : IQuery<List<CourseCurriculumMaterialStudentQri>>, IWebRequest
{
    public long CourseId { get; set; }
    public string Path => "/api/Service/CourseMaterial/ListForStudent";
}

public class CourseCurriculumMaterialStudentQri
{
    public long Id { get; set; }
    public long CourseSectionId { get; set; }
    public long? CourseLessonId { get; set; }
    public long MediaAssetId { get; set; }
    public string DisplayName { get; set; } = string.Empty;
    public string? OriginalFileName { get; set; }
    public long? FileSizeBytes { get; set; }
    /// <summary>Relative or absolute download URL for DirectDownload courses only.</summary>
    public string? DownloadUrl { get; set; }
}
