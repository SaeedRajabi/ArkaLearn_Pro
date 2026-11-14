using ArkaSoftwarePro.Src.Core.Contracts.CommunityDiscussions.CommunityDiscussionRepositoryContracts.Commands;
using ArkaSoftwarePro.Src.Core.Domain.CommunityDiscussionAggregate.Entities;
using ArkaSoftwarePro.Src.Infrastructure.Data.MSSQL.Commands.Common;
using Framework.Src.Infrastructure.Data.MSSQL.Commands.Common;
using Microsoft.EntityFrameworkCore;

namespace ArkaSoftwarePro.Src.Infrastructure.Data.MSSQL.Commands.Repositories;

public class CommunityDiscussionCommandRepository(ArkaSoftwareCommandDbContext dbContext)
    : BaseCommandRepository<CommunityThread, ArkaSoftwareCommandDbContext>(dbContext), ICommunityDiscussionCommandRepository
{
    public async Task<CommunityThread?> GetWithRepliesAsync(long threadId)
    {
        return await _dbContext.CommunityThreads
            .Include(x => x.Replies)
            .FirstOrDefaultAsync(x => x.Id == threadId && !x.IsDelete);
    }

    public async Task<CommunityReply?> GetReplyAsync(long replyId)
    {
        return await _dbContext.CommunityReplies
            .FirstOrDefaultAsync(x => x.Id == replyId && !x.IsDelete);
    }

    public async Task<bool> HasUserLikedReplyAsync(long replyId, long userId)
    {
        return await _dbContext.CommunityReplyLikes
            .AnyAsync(x => x.ReplyId == replyId && x.UserId == userId && !x.IsDelete);
    }

    public async Task AddReplyLikeAsync(CommunityReplyLike like)
    {
        await _dbContext.CommunityReplyLikes.AddAsync(like);
    }

    public async Task RemoveReplyLikeAsync(long replyId, long userId)
    {
        var like = await _dbContext.CommunityReplyLikes
            .FirstOrDefaultAsync(x => x.ReplyId == replyId && x.UserId == userId && !x.IsDelete);
        if (like != null)
            _dbContext.CommunityReplyLikes.Remove(like);
    }

    public async Task<CommunityThreadReaction?> GetThreadReactionAsync(long threadId, long userId)
    {
        return await _dbContext.CommunityThreadReactions
            .FirstOrDefaultAsync(x => x.ThreadId == threadId && x.UserId == userId && !x.IsDelete);
    }

    public async Task AddThreadReactionAsync(CommunityThreadReaction reaction)
    {
        await _dbContext.CommunityThreadReactions.AddAsync(reaction);
    }

    public async Task RemoveThreadReactionAsync(long threadId, long userId)
    {
        var reaction = await _dbContext.CommunityThreadReactions
            .FirstOrDefaultAsync(x => x.ThreadId == threadId && x.UserId == userId && !x.IsDelete);
        if (reaction != null)
            _dbContext.CommunityThreadReactions.Remove(reaction);
    }

    public async Task<bool> IsUserSubscribedAsync(long threadId, long userId)
    {
        return await _dbContext.CommunityThreadSubscriptions
            .AnyAsync(x => x.ThreadId == threadId && x.UserId == userId && !x.IsDelete);
    }

    public async Task AddSubscriptionAsync(CommunityThreadSubscription subscription)
    {
        await _dbContext.CommunityThreadSubscriptions.AddAsync(subscription);
    }

    public async Task RemoveSubscriptionAsync(long threadId, long userId)
    {
        var sub = await _dbContext.CommunityThreadSubscriptions
            .FirstOrDefaultAsync(x => x.ThreadId == threadId && x.UserId == userId && !x.IsDelete);
        if (sub != null)
            _dbContext.CommunityThreadSubscriptions.Remove(sub);
    }

    public async Task<List<long>> GetSubscriberUserIdsAsync(long threadId)
    {
        return await _dbContext.CommunityThreadSubscriptions
            .AsNoTracking()
            .Where(x => x.ThreadId == threadId && !x.IsDelete)
            .Select(x => x.UserId)
            .Distinct()
            .ToListAsync();
    }
}
