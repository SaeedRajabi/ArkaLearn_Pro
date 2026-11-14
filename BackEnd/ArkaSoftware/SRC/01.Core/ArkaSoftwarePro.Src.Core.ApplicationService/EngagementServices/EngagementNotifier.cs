using ArkaSoftwarePro.Src.Core.Contracts.Engagement;
using ArkaSoftwarePro.Src.Core.Contracts.Teachers.TeacherRepositoryContracts.Queries;
using ArkaSoftwarePro.Src.Core.Contracts.UserNotifications.UserNotificationRepositoryContracts.Commands;
using ArkaSoftwarePro.Src.Core.Domain.CoursesAggregate.Entities;
using ArkaSoftwarePro.Src.Core.Domain.UserNotificationAggregate.Entities;

namespace ArkaSoftwarePro.Src.Core.ApplicationService.EngagementServices;

public class EngagementNotifier(
    IUserNotificationCommandRepository notificationRepository,
    ITeacherQueryRepository teacherQueryRepository,
    IEngagementRealtimeNotifier engagementRealtime)
{
    public async Task NotifyCourseReviewSubmittedAsync(
        Course course,
        long commentId,
        string studentName,
        long? parentId = null)
    {
        if (course.TeacherId is not > 0)
            return;

        var teacherUserId = await teacherQueryRepository.GetUserIdByTeacherIdAsync(course.TeacherId.Value);
        if (teacherUserId is not > 0)
            return;

        var courseTitle = course.Title?.Value ?? "Course";
        await notificationRepository.InsertAsync(UserNotification.Create(
            teacherUserId.Value,
            "New course review",
            $"{studentName} left a review on \"{courseTitle}\".",
            "course_review_submitted",
            "/professor/comments",
            commentId));
        await notificationRepository.CommitAsync();

        await engagementRealtime.NotifyCommentAddedAsync(
            EngagementScopes.Course,
            course.Id,
            commentId,
            parentId,
            [teacherUserId.Value]);
    }

    public async Task NotifyCourseReviewApprovedAsync(
        long courseId,
        long studentUserId,
        string courseTitle,
        long commentId)
    {
        await notificationRepository.InsertAsync(UserNotification.Create(
            studentUserId,
            "Review approved",
            $"Your review on \"{courseTitle}\" has been approved and is now public.",
            "course_review_approved",
            null,
            commentId));
        await notificationRepository.CommitAsync();

        await engagementRealtime.NotifyCommentAddedAsync(
            EngagementScopes.Course,
            courseId,
            commentId,
            null,
            [studentUserId]);

        await engagementRealtime.NotifyUserNotificationAsync(studentUserId);
    }

    public async Task NotifyCourseReviewRepliedAsync(
        long courseId,
        long studentUserId,
        string courseTitle,
        string professorName,
        long commentId,
        long parentId)
    {
        await notificationRepository.InsertAsync(UserNotification.Create(
            studentUserId,
            "Professor replied",
            $"{professorName} replied to your review on \"{courseTitle}\".",
            "course_review_replied",
            null,
            commentId));
        await notificationRepository.CommitAsync();

        await engagementRealtime.NotifyCommentAddedAsync(
            EngagementScopes.Course,
            courseId,
            commentId,
            parentId,
            [studentUserId]);
    }

    public async Task NotifyCourseCommentLiveAsync(
        long courseId,
        long commentId,
        long? parentId,
        IReadOnlyList<long> notifyUserIds)
    {
        await engagementRealtime.NotifyCommentAddedAsync(
            EngagementScopes.Course,
            courseId,
            commentId,
            parentId,
            notifyUserIds);
    }

    public async Task NotifyArticleCommentSubmittedAsync(
        long articleId,
        long authorUserId,
        string articleTitle,
        string commenterName,
        long commentId,
        long? parentId)
    {
        if (authorUserId <= 0)
            return;

        await notificationRepository.InsertAsync(UserNotification.Create(
            authorUserId,
            "New article comment",
            $"{commenterName} commented on \"{articleTitle}\".",
            "article_comment_submitted",
            null,
            commentId));
        await notificationRepository.CommitAsync();

        await engagementRealtime.NotifyCommentAddedAsync(
            EngagementScopes.Article,
            articleId,
            commentId,
            parentId,
            [authorUserId]);
    }

    public Task NotifyArticleCommentLiveAsync(
        long articleId,
        long commentId,
        long? parentId,
        IReadOnlyList<long> notifyUserIds) =>
        engagementRealtime.NotifyCommentAddedAsync(
            EngagementScopes.Article,
            articleId,
            commentId,
            parentId,
            notifyUserIds);

    public Task NotifyPromotionalVideoCommentLiveAsync(
        long videoId,
        long commentId,
        long? parentId,
        IReadOnlyList<long> notifyUserIds) =>
        engagementRealtime.NotifyCommentAddedAsync(
            EngagementScopes.PromotionalVideo,
            videoId,
            commentId,
            parentId,
            notifyUserIds);

    public async Task NotifyPromotionalVideoCommentAsync(
        long videoId,
        long teacherUserId,
        string videoTitle,
        string commenterName,
        long commentId,
        long? parentId)
    {
        if (teacherUserId <= 0)
            return;

        await notificationRepository.InsertAsync(UserNotification.Create(
            teacherUserId,
            "New video comment",
            $"{commenterName} commented on \"{videoTitle}\".",
            "promotional_video_comment",
            "/professor/videos",
            commentId));
        await notificationRepository.CommitAsync();

        await engagementRealtime.NotifyCommentAddedAsync(
            EngagementScopes.PromotionalVideo,
            videoId,
            commentId,
            parentId,
            [teacherUserId]);
    }

    public async Task NotifyPromotionalVideoLikedAsync(
        long videoId,
        long teacherUserId,
        string videoTitle,
        int likeCount)
    {
        if (teacherUserId <= 0)
            return;

        await notificationRepository.InsertAsync(UserNotification.Create(
            teacherUserId,
            "Video liked",
            $"Someone liked your video \"{videoTitle}\".",
            "promotional_video_liked",
            "/professor/videos",
            videoId));
        await notificationRepository.CommitAsync();

        await engagementRealtime.NotifyLikeChangedAsync(
            EngagementScopes.PromotionalVideo,
            videoId,
            likeCount);
        await engagementRealtime.NotifyUserNotificationAsync(teacherUserId);
    }

    public Task NotifyPromotionalVideoLikeChangedAsync(long videoId, int likeCount) =>
        engagementRealtime.NotifyLikeChangedAsync(
            EngagementScopes.PromotionalVideo,
            videoId,
            likeCount);
}
