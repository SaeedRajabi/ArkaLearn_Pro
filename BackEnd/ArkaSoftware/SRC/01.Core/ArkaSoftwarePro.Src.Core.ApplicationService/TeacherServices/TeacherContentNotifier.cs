using ArkaSoftwarePro.Src.Core.Contracts.Engagement;
using ArkaSoftwarePro.Src.Core.Contracts.ProjectQuestions;
using ArkaSoftwarePro.Src.Core.Contracts.SupportTickets.SupportTicketRepositoryContracts.Commands;
using ArkaSoftwarePro.Src.Core.Contracts.UserNotifications.UserNotificationRepositoryContracts.Commands;
using ArkaSoftwarePro.Src.Core.Domain.UserNotificationAggregate.Entities;

namespace ArkaSoftwarePro.Src.Core.ApplicationService.TeacherServices;

public class TeacherContentNotifier(
    ISupportTicketCommandRepository supportTicketCommandRepository,
    IUserNotificationCommandRepository notificationRepository,
    IProjectQaRealtimeNotifier projectQaRealtime,
    IEngagementRealtimeNotifier engagementRealtime)
{
    public async Task NotifyAdminsContentSubmittedAsync(
        long teacherId,
        string teacherDisplayName,
        string contentType,
        string contentTitle)
    {
        var adminIds = await supportTicketCommandRepository.GetAdminUserIdsAsync();
        if (adminIds.Count == 0)
            return;

        var displayName = string.IsNullOrWhiteSpace(teacherDisplayName) ? "Teacher" : teacherDisplayName.Trim();
        var title = string.IsNullOrWhiteSpace(contentTitle) ? "Content" : contentTitle.Trim();
        var typeLabel = FormatContentTypeLabel(contentType);
        var notifications = adminIds.Select(userId => UserNotification.Create(
            userId,
            $"{typeLabel} submitted",
            $"\"{displayName}\" submitted {typeLabel.ToLowerInvariant()} \"{title}\" for approval.",
            BuildPendingNotificationType(contentType),
            $"/dashboard/teacher-content-moderation?teacherId={teacherId}",
            teacherId)).ToList();

        await notificationRepository.InsertManyAsync(notifications);
        await notificationRepository.CommitAsync();
        await projectQaRealtime.NotifyAdminsNotificationPulseAsync(adminIds);
    }

    public async Task NotifyTeacherContentReviewedAsync(
        long teacherUserId,
        bool approved,
        string? rejectionNote,
        string contentType,
        string contentTitle,
        string professorLink)
    {
        if (teacherUserId <= 0)
            return;

        var title = string.IsNullOrWhiteSpace(contentTitle) ? "Content" : contentTitle.Trim();
        var typeLabel = FormatContentTypeLabel(contentType);
        string body;
        if (approved)
        {
            body = $"Your {typeLabel.ToLowerInvariant()} \"{title}\" has been approved and is now visible on the website.";
        }
        else if (string.IsNullOrWhiteSpace(rejectionNote))
        {
            body = $"Your {typeLabel.ToLowerInvariant()} \"{title}\" was rejected. Please update and resubmit.";
        }
        else
        {
            body = $"Your {typeLabel.ToLowerInvariant()} \"{title}\" was rejected. \"{rejectionNote.Trim()}\"";
        }

        await notificationRepository.InsertAsync(UserNotification.Create(
            teacherUserId,
            approved ? $"{typeLabel} approved" : $"{typeLabel} rejected",
            body,
            approved ? BuildApprovedNotificationType(contentType) : BuildRejectedNotificationType(contentType),
            professorLink,
            null));
        await notificationRepository.CommitAsync();
        await engagementRealtime.NotifyUserNotificationAsync(teacherUserId);
    }

    private static string FormatContentTypeLabel(string contentType) =>
        (contentType ?? string.Empty).Trim().ToLowerInvariant() switch
        {
            "video" or "promotional_video" or "promotionalvideo" => "Promotional video",
            "book" => "Book",
            "course" => "Course",
            "lesson_video" or "lesson" => "Lesson video",
            "software" => "Software",
            "portfolio_article" or "portfolioarticle" => "Portfolio article",
            "article" or "platform_article" or "platformarticle" => "Article",
            "resume" or "cv" => "Resume",
            _ => "Content",
        };

    private static string BuildPendingNotificationType(string contentType) =>
        $"teacher_{NormalizeContentTypeKey(contentType)}_pending";

    private static string BuildApprovedNotificationType(string contentType) =>
        $"teacher_{NormalizeContentTypeKey(contentType)}_approved";

    private static string BuildRejectedNotificationType(string contentType) =>
        $"teacher_{NormalizeContentTypeKey(contentType)}_rejected";

    private static string NormalizeContentTypeKey(string contentType) =>
        (contentType ?? string.Empty).Trim().ToLowerInvariant() switch
        {
            "video" or "promotional_video" or "promotionalvideo" => "video",
            "book" => "book",
            "course" => "course",
            "lesson_video" or "lesson" => "lesson_video",
            "software" => "software",
            "portfolio_article" or "portfolioarticle" => "portfolio_article",
            "article" or "platform_article" or "platformarticle" => "article",
            "resume" or "cv" => "resume",
            _ => "content",
        };

    public static string ResolveProfessorLink(string contentType) =>
        NormalizeContentTypeKey(contentType) switch
        {
            "book" => "/professor/books",
            "video" => "/professor/videos",
            "course" => "/professor/courses",
            "lesson_video" => "/professor/courses",
            "software" => "/professor/software",
            "portfolio_article" => "/professor/portfolio",
            "article" => "/professor/articles",
            "resume" => "/professor/resume",
            _ => "/professor",
        };
}
