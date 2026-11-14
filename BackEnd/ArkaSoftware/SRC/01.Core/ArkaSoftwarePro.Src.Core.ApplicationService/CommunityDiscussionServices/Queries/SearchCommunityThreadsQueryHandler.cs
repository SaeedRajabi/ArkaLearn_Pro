using ArkaSoftwarePro.Src.Core.Contracts.CommunityDiscussions.CommunityDiscussionRepositoryContracts.Queries;
using ArkaSoftwarePro.Src.Core.RequestResponse.CommunityDiscussions.Queries.SearchCommunityThreads;
using Framework.Src.Core.ApplicationService.Queries;
using Framework.Src.Core.RequestResponse.Common;
using Framework.Src.Core.RequestResponse.Queries;
using Framework.Src.Utilities.OutService.Services;

namespace ArkaSoftwarePro.Src.Core.ApplicationService.CommunityDiscussionServices.Queries;

public class SearchCommunityThreadsQueryHandler(
    ArkaSoftwareCMPOutServices outer,
    ICommunityDiscussionQueriesRepository repository)
    : QueryHandler<SearchCommunityThreadsQuery, PagedData<SearchCommunityThreadQri>>(outer)
{
    public override async Task<QueryResult<PagedData<SearchCommunityThreadQri>>> Handle(SearchCommunityThreadsQuery query)
    {
        var result = await repository.SearchAsync(query);
        return await ResultAsync(result ?? new PagedData<SearchCommunityThreadQri>(), ApplicationServiceStatus.Ok);
    }
}
