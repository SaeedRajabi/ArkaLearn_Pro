using Framework.Src.Core.Domain.Entities;

namespace ArkaSoftwarePro.Src.Core.Domain.CommunityDiscussionAggregate.Entities;

public class CommunityReplyLike : Entity
{
    public long ReplyId { get; private set; }
    public long UserId { get; private set; }

    private CommunityReplyLike() { }

    public static CommunityReplyLike Create(long replyId, long userId) =>
        new() { ReplyId = replyId, UserId = userId };
}
