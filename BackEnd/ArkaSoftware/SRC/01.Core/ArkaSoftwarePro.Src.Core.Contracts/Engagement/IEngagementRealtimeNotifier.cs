namespace ArkaSoftwarePro.Src.Core.Contracts.Engagement;

public interface IEngagementRealtimeNotifier
{
    Task NotifyCommentAddedAsync(
        string scope,
        long entityId,
        long commentId,
        long? parentId,
        IReadOnlyList<long> notifyUserIds);

    Task NotifyLikeChangedAsync(string scope, long entityId, int likeCount);

    Task NotifyUserNotificationAsync(long userId);
}

public static class EngagementScopes
{
    public const string Course = "course";
    public const string Article = "article";
    public const string PromotionalVideo = "promotional-video";
}
