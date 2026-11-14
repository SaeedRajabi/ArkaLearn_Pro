using Framework.Src.Core.RequestResponse.Commands;
using Framework.Src.Core.RequestResponse.Endpoints;

namespace ArkaSoftwarePro.Src.Core.RequestResponse.EducationPlans.Commands.DeleteEducationPlan;

public class DeleteEducationPlanCommand : ICommand<bool>, IWebRequest
{
    public long PlanId { get; set; }
    public string Path => "/api/Service/EducationPlan/Delete-Plan";
}
