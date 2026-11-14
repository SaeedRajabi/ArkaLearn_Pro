using Framework.Src.Core.RequestResponse.Commands;
using Framework.Src.Core.RequestResponse.Endpoints;

namespace ArkaSoftwarePro.Src.Core.RequestResponse.Teachers.Commands.AdminGrantTeacherAdvertisementPlan;

public class AdminGrantTeacherAdvertisementPlanCommand : ICommand<string>, IWebRequest
{
    public long TeacherUserId { get; set; }
    public long TariffId { get; set; }

    public string Path => "api/Service/Teacher/AdminGrantAdvertisementPlan";
}
