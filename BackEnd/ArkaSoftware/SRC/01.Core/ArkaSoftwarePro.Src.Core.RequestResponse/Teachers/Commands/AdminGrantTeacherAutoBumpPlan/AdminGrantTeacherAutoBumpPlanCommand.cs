using Framework.Src.Core.RequestResponse.Commands;
using Framework.Src.Core.RequestResponse.Endpoints;

namespace ArkaSoftwarePro.Src.Core.RequestResponse.Teachers.Commands.AdminGrantTeacherAutoBumpPlan;

public class AdminGrantTeacherAutoBumpPlanCommand : ICommand<string>, IWebRequest
{
    public long TeacherUserId { get; set; }
    public long PackageId { get; set; }

    public string Path => "api/Service/Teacher/AdminGrantAutoBumpPlan";
}
