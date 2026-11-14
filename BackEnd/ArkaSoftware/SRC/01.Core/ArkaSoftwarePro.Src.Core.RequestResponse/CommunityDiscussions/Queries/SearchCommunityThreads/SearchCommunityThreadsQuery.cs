using Framework.Src.Core.RequestResponse.Endpoints;
using Framework.Src.Core.RequestResponse.Queries;

namespace ArkaSoftwarePro.Src.Core.RequestResponse.CommunityDiscussions.Queries.SearchCommunityThreads;

public class SearchCommunityThreadsQuery : PageQuery<PagedData<SearchCommunityThreadQri>>, IWebRequest
{
    public string? InputValue { get; set; }
    public string? SortBy { get; set; }
    public long? AuthorUserId { get; set; }

    public string Path => "/api/Service/CommunityDiscussion/Search";
}

public class SearchCommunityThreadQri
{
    public long Id { get; set; }
    public string? Subject { get; set; }
    public string? ContentPreview { get; set; }
    public string? AuthorName { get; set; }
    public string? AuthorAvatarUrl { get; set; }
    public int ReplyCount { get; set; }
    public int LikeCount { get; set; }
    public int DislikeCount { get; set; }
    public string CreatedAt { get; set; } = string.Empty;
}
