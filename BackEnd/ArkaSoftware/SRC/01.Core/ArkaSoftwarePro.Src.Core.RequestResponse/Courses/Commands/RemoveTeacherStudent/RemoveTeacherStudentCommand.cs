using Framework.Src.Core.RequestResponse.Commands;
using Framework.Src.Core.RequestResponse.Endpoints;

namespace ArkaSoftwarePro.Src.Core.RequestResponse.Courses.Commands.RemoveTeacherStudent;

public class RemoveTeacherStudentCommand : ICommand<bool>, IWebRequest
{
    public long TeacherUserId { get; set; }
    public long PortalUserId { get; set; }
    public string Path => "/api/Service/Course/RemoveMyStudent";
}
