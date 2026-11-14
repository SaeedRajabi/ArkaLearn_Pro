using ArkaSoftwarePro.Src.Core.Contracts.EducationPlans.EducationPlanRepositoryContracts.Queries;
using ArkaSoftwarePro.Src.Core.RequestResponse.EducationPlans.Queries.GetEducationPlanById;
using Framework.Src.Core.ApplicationService.Queries;
using Framework.Src.Core.RequestResponse.Common;
using Framework.Src.Core.RequestResponse.Queries;
using Framework.Src.Utilities.OutService.Services;

namespace ArkaSoftwarePro.Src.Core.ApplicationService.EducationPlanServices.Queries;

public class GetEducationPlanByIdQueryHandler(
    ArkaSoftwareCMPOutServices outer,
    IEducationPlanQueryRepository repository)
    : QueryHandler<GetEducationPlanByIdQuery, GetEducationPlanByIdQri>(outer)
{
    public override async Task<QueryResult<GetEducationPlanByIdQri>> Handle(GetEducationPlanByIdQuery query)
    {
        try
        {
            var plan = await repository.GetEducationPlanByIdExecuteAsync(query);
            if (plan == null)
                return await ResultAsync(null!, ApplicationServiceStatus.NotFound);
            return await ResultAsync(plan, ApplicationServiceStatus.Ok);
        }
        catch
        {
            return await ResultAsync(null!, ApplicationServiceStatus.Exception);
        }
    }
}
