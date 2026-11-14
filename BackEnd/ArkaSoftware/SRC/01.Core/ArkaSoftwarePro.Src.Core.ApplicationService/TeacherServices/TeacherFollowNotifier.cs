using ArkaSoftwarePro.Src.Core.Contracts.Engagement;
using ArkaSoftwarePro.Src.Core.Contracts.Teachers.TeacherRepositoryContracts.Commands;
using ArkaSoftwarePro.Src.Core.Contracts.UserNotifications.UserNotificationRepositoryContracts.Commands;
using ArkaSoftwarePro.Src.Core.Domain.UserNotificationAggregate.Entities;

namespace ArkaSoftwarePro.Src.Core.ApplicationService.TeacherServices;

public class TeacherFollowNotifier(
    ITeacherCommandRepository teacherCommandRepository,
    IUserNotificationCommandRepository notificationRepository,
    IEngagementRealtimeNotifier engagementRealtime)
{
    public async Task NotifyFollowersContentPublishedAsync(
        long teacherId,
        long? excludeUserId,
        string notificationType,
        string teacherDisplayName,
        string contentTitle,
        string linkUrl,
        long? relatedEntityId = null,
        CancellationToken cancellationToken = default)
    {
        var followerIds = await teacherCommandRepository.GetTeacherFollowerUserIdsAsync(teacherId, cancellationToken);
        if (excludeUserId is > 0)
            followerIds = followerIds.Where(id => id != excludeUserId.Value).Distinct().ToList();

        if (followerIds.Count == 0)
            return;

        var teacherName = string.IsNullOrWhiteSpace(teacherDisplayName) ? "Teacher" : teacherDisplayName.Trim();
        var itemTitle = string.IsNullOrWhiteSpace(contentTitle) ? "New content" : contentTitle.Trim();

        var notifications = followerIds.Select(userId => UserNotification.Create(
            userId,
            $"{teacherName} published new content",
            $"The teacher you follow \"{teacherName}\" published \"{itemTitle}\".",
            notificationType,
            linkUrl,
            relatedEntityId)).ToList();

        await notificationRepository.InsertManyAsync(notifications);
        await notificationRepository.CommitAsync();

        foreach (var userId in followerIds)
            await engagementRealtime.NotifyUserNotificationAsync(userId);
    }
}
