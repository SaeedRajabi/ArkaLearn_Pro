using ArkaSoftwarePro.Src.Core.Contracts.Software.SoftwareRepositoryContracts.Commands;
using ArkaSoftwarePro.Src.Core.RequestResponse.Software.Queries.SearchSoftware;
using Framework.Src.Core.ApplicationService.Queries;
using Framework.Src.Core.RequestResponse.Common;
using Framework.Src.Core.RequestResponse.Queries;
using Framework.Src.Utilities.OutService.Services;
using Microsoft.AspNetCore.Http;
using System.Security.Claims;

namespace ArkaSoftwarePro.Src.Core.ApplicationService.SoftwareServices.Queries;

public class SearchSoftwareQueryHandler(
    ArkaSoftwareCMPOutServices outer,
    ISoftwareCommandRepository softwareRepository,
    IHttpContextAccessor httpContextAccessor)
    : QueryHandler<SearchSoftwareQuery, PagedData<SoftwareListItemQri>>(outer)
{
    public override async Task<QueryResult<PagedData<SoftwareListItemQri>>> Handle(SearchSoftwareQuery query)
    {
        TryGetUserId(out var userId);
        var data = await softwareRepository.SearchPublicAsync(query, userId > 0 ? userId : null);
        return await ResultAsync(data, ApplicationServiceStatus.Ok);
    }

    private bool TryGetUserId(out long userId)
    {
        userId = 0;
        var claim = httpContextAccessor.HttpContext?.User?.Claims?.FirstOrDefault(x =>
            x.Type == ClaimTypes.NameIdentifier || x.Type == "userId" || x.Type == "nameid");
        return claim != null && long.TryParse(claim.Value, out userId) && userId > 0;
    }
}
