using ArkaSoftwarePro.Src.Core.ApplicationService.SecurityServices;
using ArkaSoftwarePro.Src.Core.ApplicationService.UsersServices.Helpers;
using ArkaSoftwarePro.Src.Core.Contracts.DesktopDrm.DesktopDrmRepositoryContracts.Commands;
using ArkaSoftwarePro.Src.Core.RequestResponse.DesktopDrm.Queries.GetDesktopAccessBlocks;
using Framework.Src.Core.ApplicationService.Queries;
using Framework.Src.Core.RequestResponse.Common;
using Framework.Src.Core.RequestResponse.Queries;
using Framework.Src.Utilities.OutService.Services;
using Microsoft.AspNetCore.Http;

namespace ArkaSoftwarePro.Src.Core.ApplicationService.DesktopDrmServices.Queries;

public class GetDesktopAccessBlocksQueryHandler(
    ArkaSoftwareCMPOutServices outer,
    IDesktopDrmCommandRepository repository,
    IHttpContextAccessor httpContextAccessor)
    : QueryHandler<GetDesktopAccessBlocksQuery, List<DesktopAccessBlockAdminQri>>(outer)
{
    public override async Task<QueryResult<List<DesktopAccessBlockAdminQri>>> Handle(GetDesktopAccessBlocksQuery query)
    {
        if (!DashboardAdminRoleChecker.IsDashboardAdminRole(httpContextAccessor.HttpContext?.User))
        {
            AddMessage("Admin access required.");
            return await ResultAsync([], ApplicationServiceStatus.ValidationError);
        }

        var rows = await repository.ListAccessBlocksAsync(query.UserId, query.ActiveOnly, query.Take);
        var items = rows.Select(x => new DesktopAccessBlockAdminQri
        {
            Id = x.Id,
            UserId = x.UserId,
            Scope = x.Scope,
            Reason = x.Reason,
            BlockedAtUtc = x.BlockedAtUtc,
            UnblockedAtUtc = x.UnblockedAtUtc,
            IsActive = x.IsActive,
        }).ToList();

        return await ResultAsync(items, ApplicationServiceStatus.Ok);
    }
}
