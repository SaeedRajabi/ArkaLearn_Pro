using ArkaSoftwarePro.Src.Infrastructure.Data.MSSQL.Queries.Entities.Users;

namespace ArkaSoftwarePro.Src.Infrastructure.Data.MSSQL.Queries.Entities.CommunityDiscussions;

public class CommunityThreadQueryModel
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
    public DateTime CreatedDateTime { get; set; }
    public bool IsDelete { get; set; }

    public UserQueryModel? User { get; set; }
    public List<CommunityReplyQueryModel> Replies { get; set; } = new();
}

public class CommunityReplyQueryModel
{
    public long Id { get; set; }
    public long ThreadId { get; set; }
    public long UserId { get; set; }
    public string ContentHtml { get; set; } = string.Empty;
    public string? AudioUrl { get; set; }
    public int LikeCount { get; set; }
    public DateTime CreatedDateTime { get; set; }
    public bool IsDelete { get; set; }

    public UserQueryModel? User { get; set; }
}

public class CommunityReplyLikeQueryModel
{
    public long Id { get; set; }
    public long ReplyId { get; set; }
    public long UserId { get; set; }
    public bool IsDelete { get; set; }
}

public class CommunityThreadReactionQueryModel
{
    public long Id { get; set; }
    public long ThreadId { get; set; }
    public long UserId { get; set; }
    public int Reaction { get; set; }
    public bool IsDelete { get; set; }
}

public class CommunityThreadSubscriptionQueryModel
{
    public long Id { get; set; }
    public long ThreadId { get; set; }
    public long UserId { get; set; }
    public bool IsDelete { get; set; }
}
