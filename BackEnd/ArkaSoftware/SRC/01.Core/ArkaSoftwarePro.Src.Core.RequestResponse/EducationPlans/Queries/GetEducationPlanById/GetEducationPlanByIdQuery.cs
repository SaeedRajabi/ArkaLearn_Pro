using Framework.Src.Core.RequestResponse.Endpoints;
using Framework.Src.Core.RequestResponse.Queries;

namespace ArkaSoftwarePro.Src.Core.RequestResponse.EducationPlans.Queries.GetEducationPlanById
{
    public class GetEducationPlanByIdQuery:IQuery<GetEducationPlanByIdQri> , IWebRequest
    {
        public long PlanId { get; set; }

        public string Path => "/api/Service/EducationPlan/GetById";
    }
}
