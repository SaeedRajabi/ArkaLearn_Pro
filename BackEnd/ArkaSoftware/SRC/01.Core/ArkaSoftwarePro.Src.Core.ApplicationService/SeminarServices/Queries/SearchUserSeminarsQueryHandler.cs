using ArkaSoftwarePro.Src.Core.ApplicationService.SecurityServices;
using ArkaSoftwarePro.Src.Core.ApplicationService.UsersServices.Helpers;
using ArkaSoftwarePro.Src.Core.Contracts.Seminars.SeminarRepositoryContracts.Queries;
using ArkaSoftwarePro.Src.Core.RequestResponse.Seminars.Queries.SearchSeminars;
using ArkaSoftwarePro.Src.Core.RequestResponse.Seminars.Queries.SearchUserSeminars;
using Framework.Src.Core.ApplicationService.Queries;
using Framework.Src.Core.RequestResponse.Common;
using Framework.Src.Core.RequestResponse.Queries;
using Framework.Src.Utilities.OutService.Services;
using Microsoft.AspNetCore.Http;

namespace ArkaSoftwarePro.Src.Core.ApplicationService.SeminarServices.Queries;

public class SearchUserSeminarsQueryHandler(
    ArkaSoftwareCMPOutServices outer,
    ISeminarQueriesRepository repository,
    IHttpContextAccessor httpContextAccessor)
    : QueryHandler<SearchUserSeminarsQuery, PagedData<SearchSeminarQri>>(outer)
{
    public override async Task<QueryResult<PagedData<SearchSeminarQri>>> Handle(SearchUserSeminarsQuery query)
    {
        if (!DashboardAdminRoleChecker.IsDashboardAdminRole(httpContextAccessor.HttpContext?.User))
            return await ResultAsync(new PagedData<SearchSeminarQri>(), ApplicationServiceStatus.ValidationError);

        if (query.TeacherUserId <= 0)
            return await ResultAsync(new PagedData<SearchSeminarQri>(), ApplicationServiceStatus.ValidationError);

        var result = await repository.SearchUserSeminarsExecuteAsync(query);
        return await ResultAsync(result ?? new PagedData<SearchSeminarQri>(), ApplicationServiceStatus.Ok);
    }
}
