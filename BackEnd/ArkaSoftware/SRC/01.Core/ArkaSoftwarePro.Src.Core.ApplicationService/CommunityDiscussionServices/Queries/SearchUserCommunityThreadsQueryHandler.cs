using ArkaSoftwarePro.Src.Core.ApplicationService.SecurityServices;
using ArkaSoftwarePro.Src.Core.ApplicationService.UsersServices.Helpers;
using ArkaSoftwarePro.Src.Core.Contracts.CommunityDiscussions.CommunityDiscussionRepositoryContracts.Queries;
using ArkaSoftwarePro.Src.Core.RequestResponse.CommunityDiscussions.Queries.SearchCommunityThreads;
using ArkaSoftwarePro.Src.Core.RequestResponse.CommunityDiscussions.Queries.SearchUserCommunityThreads;
using Framework.Src.Core.ApplicationService.Queries;
using Framework.Src.Core.RequestResponse.Common;
using Framework.Src.Core.RequestResponse.Queries;
using Framework.Src.Utilities.OutService.Services;
using Microsoft.AspNetCore.Http;

namespace ArkaSoftwarePro.Src.Core.ApplicationService.CommunityDiscussionServices.Queries;

public class SearchUserCommunityThreadsQueryHandler(
    ArkaSoftwareCMPOutServices outer,
    ICommunityDiscussionQueriesRepository repository,
    IHttpContextAccessor httpContextAccessor)
    : QueryHandler<SearchUserCommunityThreadsQuery, PagedData<SearchCommunityThreadQri>>(outer)
{
    public override async Task<QueryResult<PagedData<SearchCommunityThreadQri>>> Handle(SearchUserCommunityThreadsQuery query)
    {
        if (!DashboardAdminRoleChecker.IsDashboardAdminRole(httpContextAccessor.HttpContext?.User))
            return await ResultAsync(new PagedData<SearchCommunityThreadQri>(), ApplicationServiceStatus.ValidationError);

        if (query.UserId <= 0)
            return await ResultAsync(new PagedData<SearchCommunityThreadQri>(), ApplicationServiceStatus.ValidationError);

        var result = await repository.SearchAsync(new SearchCommunityThreadsQuery
        {
            AuthorUserId = query.UserId,
            PageNumber = query.PageNumber,
            PageSize = query.PageSize,
            NeedTotalCount = query.NeedTotalCount,
        });

        return await ResultAsync(result ?? new PagedData<SearchCommunityThreadQri>(), ApplicationServiceStatus.Ok);
    }
}
