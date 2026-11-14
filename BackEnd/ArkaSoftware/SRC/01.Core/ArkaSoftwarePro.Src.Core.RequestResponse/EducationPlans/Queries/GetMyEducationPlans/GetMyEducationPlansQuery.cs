using Framework.Src.Core.RequestResponse.Endpoints;
using Framework.Src.Core.RequestResponse.Queries;

namespace ArkaSoftwarePro.Src.Core.RequestResponse.EducationPlans.Queries.GetMyEducationPlans;

public class GetMyEducationPlansQuery : IQuery<List<MyEducationPlanQri>>, IWebRequest
{
    public long UserId { get; set; }
    public string UserName { get; set; } = string.Empty;
    public string? Email { get; set; }

    public string Path => "/api/Service/EducationPlan/GetMyPlans";
}
