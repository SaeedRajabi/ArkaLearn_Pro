using ArkaSoftwarePro.Src.Core.Contracts.EducationPlans.EducationPlanRepositoryContracts.Queries;
using ArkaSoftwarePro.Src.Core.Contracts.Users.UserRepositoryContracts.Queries;
using ArkaSoftwarePro.Src.Core.RequestResponse.EducationPlans.Queries.GetMyEducationPlans;
using ArkaSoftwarePro.Src.Core.RequestResponse.Users.Queries.GetById;
using Framework.Src.Core.ApplicationService.Queries;
using Framework.Src.Core.RequestResponse.Common;
using Framework.Src.Core.RequestResponse.Queries;
using Framework.Src.Utilities.OutService.Services;

namespace ArkaSoftwarePro.Src.Core.ApplicationService.EducationPlanServices.Queries;

public class GetMyEducationPlansQueryHandler(
    ArkaSoftwareCMPOutServices outer,
    IEducationPlanQueryRepository planRepository,
    IUserQueryRepository userQueryRepository)
    : QueryHandler<GetMyEducationPlansQuery, List<MyEducationPlanQri>>(outer)
{
    public override async Task<QueryResult<List<MyEducationPlanQri>>> Handle(GetMyEducationPlansQuery query)
    {
        if (query.UserId <= 0)
            return await ResultAsync([], ApplicationServiceStatus.Ok);

        var user = await userQueryRepository.ExecuteAsync(new GetUserByIdQuery { UserId = query.UserId });
        var userName = user?.UserName ?? query.UserName;
        var email = user?.Email ?? query.Email;

        var studentIds = await planRepository.ResolveManagedStudentIdsForUserAsync(
            query.UserId,
            userName,
            email);

        var plans = await planRepository.GetMyEducationPlansAsync(studentIds);
        return await ResultAsync(plans, ApplicationServiceStatus.Ok);
    }
}
