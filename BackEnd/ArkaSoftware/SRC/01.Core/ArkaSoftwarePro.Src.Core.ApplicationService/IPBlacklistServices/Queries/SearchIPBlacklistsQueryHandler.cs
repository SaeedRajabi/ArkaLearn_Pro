using ArkaSoftwarePro.Src.Core.ApplicationService.SecurityServices;
using ArkaSoftwarePro.Src.Core.ApplicationService.UsersServices.Helpers;
using ArkaSoftwarePro.Src.Core.Contracts.IPBlacklist.IPBlacklistRepositoryContracts.Queries;
using ArkaSoftwarePro.Src.Core.RequestResponse.IPBlacklist.Queries.SearchIPBlacklists;
using Framework.Src.Core.ApplicationService.Queries;
using Framework.Src.Core.RequestResponse.Common;
using Framework.Src.Core.RequestResponse.Queries;
using Framework.Src.Utilities.OutService.Services;
using Microsoft.AspNetCore.Http;
using ResponseIPBlacklistListItemQri = ArkaSoftwarePro.Src.Core.RequestResponse.IPBlacklist.Queries.SearchIPBlacklists.IPBlacklistListItemQri;

namespace ArkaSoftwarePro.Src.Core.ApplicationService.IPBlacklistServices.Queries;

public class SearchIPBlacklistsQueryHandler(
    ArkaSoftwareCMPOutServices outer,
    IIPBlacklistQueryRepository repository,
    IHttpContextAccessor httpContextAccessor)
    : QueryHandler<SearchIPBlacklistsQuery, PagedData<ResponseIPBlacklistListItemQri>>(outer)
{
    public override async Task<QueryResult<PagedData<ResponseIPBlacklistListItemQri>>> Handle(SearchIPBlacklistsQuery query)
    {
        if (!DashboardAdminRoleChecker.IsDashboardAdminRole(httpContextAccessor.HttpContext?.User))
        {
            AddMessage("Admin access required.");
            return await ResultAsync(new PagedData<ResponseIPBlacklistListItemQri>(), ApplicationServiceStatus.ValidationError);
        }

        var pageNumber = query.PageNumber > 0 ? query.PageNumber : 1;
        var pageSize = query.PageSize is > 0 and <= 100 ? query.PageSize : 20;
        var result = await repository.SearchAsync(query.InputValue, pageNumber, pageSize);
        var mapped = new PagedData<ResponseIPBlacklistListItemQri>
        {
            TotalCount = result?.TotalCount ?? 0,
            QueryResult = result?.QueryResult?.Select(x => new ResponseIPBlacklistListItemQri
            {
                Id = x.Id,
                IpAddress = x.IpAddress,
                DeviceInformation = x.DeviceInformation,
                Reason = x.Reason,
                AddedDate = x.AddedDate,
                ExpirationDate = x.ExpirationDate,
                IsPermanent = x.IsPermanent,
            }).ToList() ?? [],
        };

        return await ResultAsync(mapped, ApplicationServiceStatus.Ok);
    }
}
