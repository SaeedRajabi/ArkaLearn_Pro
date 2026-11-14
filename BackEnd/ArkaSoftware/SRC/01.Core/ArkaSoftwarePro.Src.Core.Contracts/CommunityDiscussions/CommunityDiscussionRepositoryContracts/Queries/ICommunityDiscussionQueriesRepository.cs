using ArkaSoftwarePro.Src.Core.RequestResponse.CommunityDiscussions.Queries.GetCommunityThreadById;
using ArkaSoftwarePro.Src.Core.RequestResponse.CommunityDiscussions.Queries.SearchCommunityThreads;
using Framework.Src.Core.RequestResponse.Queries;

namespace ArkaSoftwarePro.Src.Core.Contracts.CommunityDiscussions.CommunityDiscussionRepositoryContracts.Queries;

public interface ICommunityDiscussionQueriesRepository
{
    Task<PagedData<SearchCommunityThreadQri>?> SearchAsync(SearchCommunityThreadsQuery query);
    Task<CommunityThreadDetailQri?> GetByIdAsync(GetCommunityThreadByIdQuery query);
}
