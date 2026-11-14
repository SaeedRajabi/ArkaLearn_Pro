using System.Security.Claims;
using ArkaSoftwarePro.Src.Core.Contracts.Finance.FinanceRepositoryContracts.Queries;
using ArkaSoftwarePro.Src.Core.RequestResponse.Teachers.Queries.GetTeacherPayoutQueue;
using Framework.Src.Core.ApplicationService.Queries;
using Framework.Src.Core.RequestResponse.Common;
using Framework.Src.Core.RequestResponse.Queries;
using Framework.Src.Utilities.OutService.Services;
using Microsoft.AspNetCore.Http;

namespace ArkaSoftwarePro.Src.Core.ApplicationService.TeacherServices.Queries;

public class GetTeacherPayoutQueueQueryHandler(
    ArkaSoftwareCMPOutServices outer,
    ITeacherFinanceQueryRepository financeQueryRepository,
    IHttpContextAccessor httpContextAccessor)
    : QueryHandler<GetTeacherPayoutQueueQuery, List<AdminTeacherPayoutQri>>(outer)
{
    public override async Task<QueryResult<List<AdminTeacherPayoutQri>>> Handle(GetTeacherPayoutQueueQuery query)
    {
        if (!IsAdminUser())
            return await ResultAsync(null!, ApplicationServiceStatus.NotFound);

        var payouts = await financeQueryRepository.GetAdminPayoutQueueAsync(query.Status, query.Take);
        return await ResultAsync(payouts, ApplicationServiceStatus.Ok);
    }

    private bool IsAdminUser()
    {
        var roleClaim = httpContextAccessor.HttpContext?.User?.Claims?
            .FirstOrDefault(x => x.Type == ClaimTypes.Role)?.Value;
        return roleClaim?.ToLowerInvariant() is "3" or "admin" or "super admin";
    }
}
