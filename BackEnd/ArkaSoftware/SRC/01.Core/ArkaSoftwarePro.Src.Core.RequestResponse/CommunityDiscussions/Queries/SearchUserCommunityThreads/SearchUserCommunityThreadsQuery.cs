using ArkaSoftwarePro.Src.Core.RequestResponse.CommunityDiscussions.Queries.SearchCommunityThreads;
using Framework.Src.Core.RequestResponse.Endpoints;
using Framework.Src.Core.RequestResponse.Queries;

namespace ArkaSoftwarePro.Src.Core.RequestResponse.CommunityDiscussions.Queries.SearchUserCommunityThreads;

public class SearchUserCommunityThreadsQuery : PageQuery<PagedData<SearchCommunityThreadQri>>, IWebRequest
{
    public long UserId { get; set; }

    public string Path => "/api/Service/Student/SearchUserCommunityThreads";
}
