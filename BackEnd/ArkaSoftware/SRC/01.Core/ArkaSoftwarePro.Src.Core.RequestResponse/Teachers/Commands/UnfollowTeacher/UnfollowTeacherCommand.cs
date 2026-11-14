using Framework.Src.Core.RequestResponse.Commands;
using Framework.Src.Core.RequestResponse.Endpoints;

namespace ArkaSoftwarePro.Src.Core.RequestResponse.Teachers.Commands.UnfollowTeacher;

public class UnfollowTeacherCommand : ICommand<string>, IWebRequest
{
    public long UserId { get; set; }
    public long TeacherId { get; set; }
    public string Path => "/api/Service/Teacher/UnfollowTeacher";
}
