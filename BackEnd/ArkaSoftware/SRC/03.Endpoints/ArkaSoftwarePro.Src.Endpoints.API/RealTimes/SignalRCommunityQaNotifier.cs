using ArkaSoftwarePro.Src.Core.Contracts.CommunityDiscussions;
using ArkaSoftwarePro.Src.Endpoints.API.Hubs;
using Microsoft.AspNetCore.SignalR;

namespace ArkaSoftwarePro.Src.Endpoints.API.RealTimes;

public class SignalRCommunityQaNotifier(IHubContext<CommunityQaHub> hubContext) : ICommunityQaRealtimeNotifier
{
    public Task NotifyThreadCreatedAsync(long threadId)
    {
        return hubContext.Clients.Group(CommunityQaHub.ListGroup)
            .SendAsync("ThreadCreated", new { threadId });
    }

    public async Task NotifyReplyPostedAsync(long threadId, long replyId, IReadOnlyList<long> subscriberUserIds)
    {
        var payload = new { threadId, replyId };

        await hubContext.Clients.Group(CommunityQaHub.ThreadGroup(threadId))
            .SendAsync("ReplyPosted", payload);

        foreach (var userId in subscriberUserIds.Distinct())
        {
            await hubContext.Clients.Group(CommunityQaHub.UserGroup(userId))
                .SendAsync("ReplyPosted", payload);
        }
    }

    public Task NotifyThreadReactionChangedAsync(long threadId, int likes, int dislikes)
    {
        return hubContext.Clients.Group(CommunityQaHub.ThreadGroup(threadId))
            .SendAsync("ThreadReactionChanged", new { threadId, likes, dislikes });
    }

    public Task NotifyReplyLikeChangedAsync(long threadId, long replyId, int likeCount)
    {
        return hubContext.Clients.Group(CommunityQaHub.ThreadGroup(threadId))
            .SendAsync("ReplyLikeChanged", new { threadId, replyId, likeCount });
    }

    public Task NotifyUserNotificationAsync(long userId)
    {
        return hubContext.Clients.Group(CommunityQaHub.UserGroup(userId))
            .SendAsync("NotificationPulse");
    }
}
