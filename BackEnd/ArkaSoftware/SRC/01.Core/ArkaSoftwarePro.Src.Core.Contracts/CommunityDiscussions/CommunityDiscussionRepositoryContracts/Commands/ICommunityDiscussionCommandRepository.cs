using ArkaSoftwarePro.Src.Core.Domain.CommunityDiscussionAggregate.Entities;
using Framework.Src.Core.Contracts.Data.Commands;

namespace ArkaSoftwarePro.Src.Core.Contracts.CommunityDiscussions.CommunityDiscussionRepositoryContracts.Commands;

public interface ICommunityDiscussionCommandRepository : ICommandRepository<CommunityThread, long>
{
    Task<CommunityThread?> GetWithRepliesAsync(long threadId);
    Task<CommunityReply?> GetReplyAsync(long replyId);
    Task<bool> HasUserLikedReplyAsync(long replyId, long userId);
    Task AddReplyLikeAsync(CommunityReplyLike like);
    Task RemoveReplyLikeAsync(long replyId, long userId);
    Task<CommunityThreadReaction?> GetThreadReactionAsync(long threadId, long userId);
    Task AddThreadReactionAsync(CommunityThreadReaction reaction);
    Task RemoveThreadReactionAsync(long threadId, long userId);
    Task<bool> IsUserSubscribedAsync(long threadId, long userId);
    Task AddSubscriptionAsync(CommunityThreadSubscription subscription);
    Task RemoveSubscriptionAsync(long threadId, long userId);
    Task<List<long>> GetSubscriberUserIdsAsync(long threadId);
}
