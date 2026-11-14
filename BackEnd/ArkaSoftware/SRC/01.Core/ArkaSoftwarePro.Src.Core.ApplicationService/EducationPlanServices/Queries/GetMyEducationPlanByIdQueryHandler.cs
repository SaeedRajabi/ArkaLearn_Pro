using ArkaSoftwarePro.Src.Core.Contracts.EducationPlans.EducationPlanRepositoryContracts.Queries;
using ArkaSoftwarePro.Src.Core.Contracts.Users.UserRepositoryContracts.Queries;
using ArkaSoftwarePro.Src.Core.RequestResponse.EducationPlans.Queries.GetEducationPlanById;
using ArkaSoftwarePro.Src.Core.RequestResponse.EducationPlans.Queries.GetMyEducationPlanById;
using ArkaSoftwarePro.Src.Core.RequestResponse.Users.Queries.GetById;
using Framework.Src.Core.ApplicationService.Queries;
using Framework.Src.Core.RequestResponse.Common;
using Framework.Src.Core.RequestResponse.Queries;
using Framework.Src.Utilities.OutService.Services;

namespace ArkaSoftwarePro.Src.Core.ApplicationService.EducationPlanServices.Queries;

public class GetMyEducationPlanByIdQueryHandler(
    ArkaSoftwareCMPOutServices outer,
    IEducationPlanQueryRepository planRepository,
    IUserQueryRepository userQueryRepository)
    : QueryHandler<GetMyEducationPlanByIdQuery, GetEducationPlanByIdQri>(outer)
{
    public override async Task<QueryResult<GetEducationPlanByIdQri>> Handle(GetMyEducationPlanByIdQuery query)
    {
        if (query.UserId <= 0 || query.PlanId <= 0)
            return await ResultAsync(null!, ApplicationServiceStatus.NotFound);

        var user = await userQueryRepository.ExecuteAsync(new GetUserByIdQuery { UserId = query.UserId });
        var studentIds = await planRepository.ResolveManagedStudentIdsForUserAsync(
            query.UserId,
            user?.UserName ?? query.UserName,
            user?.Email ?? query.Email);

        var plan = await planRepository.GetEducationPlanForStudentAsync(query.PlanId, studentIds);
        if (plan == null)
            return await ResultAsync(null!, ApplicationServiceStatus.NotFound);

        return await ResultAsync(plan, ApplicationServiceStatus.Ok);
    }
}
