namespace ArkaSoftwarePro.Src.Core.Contracts.CommunityDiscussions;

public interface ICommunityQaRealtimeNotifier
{
    Task NotifyThreadCreatedAsync(long threadId);

    Task NotifyReplyPostedAsync(long threadId, long replyId, IReadOnlyList<long> subscriberUserIds);

    Task NotifyThreadReactionChangedAsync(long threadId, int likes, int dislikes);

    Task NotifyReplyLikeChangedAsync(long threadId, long replyId, int likeCount);

    Task NotifyUserNotificationAsync(long userId);
}
