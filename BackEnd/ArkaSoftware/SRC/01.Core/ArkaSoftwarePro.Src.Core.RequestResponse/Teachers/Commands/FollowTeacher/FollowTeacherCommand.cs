using Framework.Src.Core.RequestResponse.Commands;
using Framework.Src.Core.RequestResponse.Endpoints;

namespace ArkaSoftwarePro.Src.Core.RequestResponse.Teachers.Commands.FollowTeacher;

public class FollowTeacherCommand : ICommand<string>, IWebRequest
{
    public long UserId { get; set; }
    public long TeacherId { get; set; }
    public string Path => "/api/Service/Teacher/FollowTeacher";
}
