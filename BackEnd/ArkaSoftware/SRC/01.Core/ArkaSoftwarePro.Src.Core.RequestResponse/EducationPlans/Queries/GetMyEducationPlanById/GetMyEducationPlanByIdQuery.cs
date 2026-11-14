using ArkaSoftwarePro.Src.Core.RequestResponse.EducationPlans.Queries.GetEducationPlanById;
using Framework.Src.Core.RequestResponse.Endpoints;
using Framework.Src.Core.RequestResponse.Queries;

namespace ArkaSoftwarePro.Src.Core.RequestResponse.EducationPlans.Queries.GetMyEducationPlanById;

public class GetMyEducationPlanByIdQuery : IQuery<GetEducationPlanByIdQri>, IWebRequest
{
    public long PlanId { get; set; }
    public long UserId { get; set; }
    public string UserName { get; set; } = string.Empty;
    public string? Email { get; set; }

    public string Path => "/api/Service/EducationPlan/GetMyPlanById";
}
