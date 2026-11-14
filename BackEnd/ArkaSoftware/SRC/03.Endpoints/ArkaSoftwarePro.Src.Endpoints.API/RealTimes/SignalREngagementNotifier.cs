using ArkaSoftwarePro.Src.Core.Contracts.Engagement;
using ArkaSoftwarePro.Src.Endpoints.API.Hubs;
using Microsoft.AspNetCore.SignalR;

namespace ArkaSoftwarePro.Src.Endpoints.API.RealTimes;

public class SignalREngagementNotifier(IHubContext<EngagementHub> hubContext) : IEngagementRealtimeNotifier
{
    public async Task NotifyCommentAddedAsync(
        string scope,
        long entityId,
        long commentId,
        long? parentId,
        IReadOnlyList<long> notifyUserIds)
    {
        var payload = new { scope, entityId, commentId, parentId };

        await hubContext.Clients.Group(ResolveEntityGroup(scope, entityId))
            .SendAsync("CommentAdded", payload);

        foreach (var userId in notifyUserIds.Distinct().Where(id => id > 0))
        {
            await hubContext.Clients.Group(EngagementHub.UserGroup(userId))
                .SendAsync("CommentAdded", payload);
            await NotifyUserNotificationAsync(userId);
        }
    }

    public Task NotifyLikeChangedAsync(string scope, long entityId, int likeCount)
    {
        return hubContext.Clients.Group(ResolveEntityGroup(scope, entityId))
            .SendAsync("LikeChanged", new { scope, entityId, likeCount });
    }

    public Task NotifyUserNotificationAsync(long userId)
    {
        return hubContext.Clients.Group(EngagementHub.UserGroup(userId))
            .SendAsync("NotificationPulse");
    }

    private static string ResolveEntityGroup(string scope, long entityId) => scope switch
    {
        EngagementScopes.Course => EngagementHub.CourseGroup(entityId),
        EngagementScopes.Article => EngagementHub.ArticleGroup(entityId),
        EngagementScopes.PromotionalVideo => EngagementHub.VideoGroup(entityId),
        _ => EngagementHub.UserGroup(entityId),
    };
}
