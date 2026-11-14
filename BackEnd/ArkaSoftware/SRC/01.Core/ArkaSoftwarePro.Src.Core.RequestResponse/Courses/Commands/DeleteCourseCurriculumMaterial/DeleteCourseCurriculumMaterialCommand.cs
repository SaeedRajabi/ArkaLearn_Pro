using Framework.Src.Core.RequestResponse.Commands;
using Framework.Src.Core.RequestResponse.Endpoints;

namespace ArkaSoftwarePro.Src.Core.RequestResponse.Courses.Commands.DeleteCourseCurriculumMaterial;

public class DeleteCourseCurriculumMaterialCommand : ICommand<string>, IWebRequest
{
    public long MaterialId { get; set; }
    public string Path => "/api/Service/CourseMaterial/Delete";
}
