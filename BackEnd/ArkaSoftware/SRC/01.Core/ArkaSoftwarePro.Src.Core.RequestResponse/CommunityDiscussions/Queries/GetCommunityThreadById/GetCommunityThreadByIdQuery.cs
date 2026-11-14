using Framework.Src.Core.RequestResponse.Endpoints;
using Framework.Src.Core.RequestResponse.Queries;

namespace ArkaSoftwarePro.Src.Core.RequestResponse.CommunityDiscussions.Queries.GetCommunityThreadById;

public class GetCommunityThreadByIdQuery : IQuery<CommunityThreadDetailQri>, IWebRequest
{
    public long ThreadId { get; set; }
    public long? CurrentUserId { get; set; }

    public string Path => "/api/Service/CommunityDiscussion/GetById";
}

public class CommunityThreadDetailQri
{
    public long Id { get; set; }
    public long UserId { get; set; }
    public string? Subject { get; set; }
    public string ContentHtml { get; set; } = string.Empty;
    public string? AudioUrl { get; set; }
    public string? Slug { get; set; }
    public int ReplyCount { get; set; }
    public int LikeCount { get; set; }
    public int DislikeCount { get; set; }
    public int MyReaction { get; set; }
    public bool IsSubscribed { get; set; }
    public string? AuthorName { get; set; }
    public string? AuthorAvatarUrl { get; set; }
    public string CreatedAt { get; set; } = string.Empty;
    public List<CommunityReplyQri> Replies { get; set; } = new();
}

public class CommunityReplyQri
{
    public long Id { get; set; }
    public long UserId { get; set; }
    public string ContentHtml { get; set; } = string.Empty;
    public string? AudioUrl { get; set; }
    public int LikeCount { get; set; }
    public bool LikedByCurrentUser { get; set; }
    public string? AuthorName { get; set; }
    public string? AuthorAvatarUrl { get; set; }
    public string CreatedAt { get; set; } = string.Empty;
}
