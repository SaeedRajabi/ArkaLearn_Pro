using Framework.Src.Core.Domain.Entities;

namespace ArkaSoftwarePro.Src.Core.Domain.CommunityDiscussionAggregate.Entities;

public class CommunityThreadReaction : Entity
{
    private CommunityThreadReaction() { }

    public CommunityThreadReaction(long threadId, long userId, int reaction)
    {
        ThreadId = threadId;
        UserId = userId;
        SetReaction(reaction);
    }

    public long ThreadId { get; private set; }
    public long UserId { get; private set; }
    public int Reaction { get; private set; }

    public void SetReaction(int reaction)
    {
        if (reaction is not (1 or -1))
            throw new ArgumentOutOfRangeException(nameof(reaction), "Thread reaction must be like (1) or dislike (-1).");

        Reaction = reaction;
    }
}
