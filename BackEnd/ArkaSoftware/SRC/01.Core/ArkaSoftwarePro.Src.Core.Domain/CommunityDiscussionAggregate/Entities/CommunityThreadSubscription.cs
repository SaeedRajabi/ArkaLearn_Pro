using Framework.Src.Core.Domain.Entities;

namespace ArkaSoftwarePro.Src.Core.Domain.CommunityDiscussionAggregate.Entities;

public class CommunityThreadSubscription : Entity
{
    public long ThreadId { get; private set; }
    public long UserId { get; private set; }

    private CommunityThreadSubscription() { }

    public static CommunityThreadSubscription Create(long threadId, long userId) =>
        new() { ThreadId = threadId, UserId = userId };
}
