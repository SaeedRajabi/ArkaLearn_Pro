using Framework.Src.Core.RequestResponse.Commands;
using Framework.Src.Core.RequestResponse.Endpoints;

namespace ArkaSoftwarePro.Src.Core.RequestResponse.Courses.Commands.CreateCourseCurriculumMaterial;

public class CreateCourseCurriculumMaterialCommand : ICommand<long>, IWebRequest
{
    public long CourseId { get; set; }
    public long CourseSectionId { get; set; }
    public long? CourseLessonId { get; set; }
    public long MediaAssetId { get; set; }
    public string DisplayName { get; set; } = string.Empty;

    public string Path => "/api/Service/CourseMaterial/Create";
}
