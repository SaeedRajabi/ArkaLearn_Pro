using ArkaSoftwarePro.Src.Core.Contracts.Engagement;
using ArkaSoftwarePro.Src.Core.Contracts.ProjectQuestions;
using ArkaSoftwarePro.Src.Core.Contracts.SupportTickets.SupportTicketRepositoryContracts.Commands;
using ArkaSoftwarePro.Src.Core.Contracts.UserNotifications.UserNotificationRepositoryContracts.Commands;
using ArkaSoftwarePro.Src.Core.Domain.UserNotificationAggregate.Entities;

namespace ArkaSoftwarePro.Src.Core.ApplicationService.TeacherServices;

public class TeacherAdvertisementNotifier(
    ISupportTicketCommandRepository supportTicketCommandRepository,
    IUserNotificationCommandRepository notificationRepository,
    IProjectQaRealtimeNotifier projectQaRealtime,
    IEngagementRealtimeNotifier engagementRealtime)
{
    public async Task NotifyAdminsAdvertisementSubmittedAsync(
        long teacherId,
        string teacherDisplayName,
        string advertisementTitle)
    {
        var adminIds = await supportTicketCommandRepository.GetAdminUserIdsAsync();
        if (adminIds.Count == 0)
            return;

        var displayName = string.IsNullOrWhiteSpace(teacherDisplayName) ? "Teacher" : teacherDisplayName.Trim();
        var title = string.IsNullOrWhiteSpace(advertisementTitle) ? "Advertisement" : advertisementTitle.Trim();
        var notifications = adminIds.Select(userId => UserNotification.Create(
            userId,
            "Teacher advertisement updated",
            $"\"{displayName}\" updated advertisement \"{title}\" and it is waiting for approval.",
            "teacher_advertisement_pending",
            $"/dashboard/teacher-content-moderation?teacherId={teacherId}",
            teacherId)).ToList();

        await notificationRepository.InsertManyAsync(notifications);
        await notificationRepository.CommitAsync();

        await projectQaRealtime.NotifyAdminsNotificationPulseAsync(adminIds);
    }

    public async Task NotifyTeacherAdvertisementReviewedAsync(
        long teacherUserId,
        bool approved,
        string? rejectionNote,
        string advertisementTitle)
    {
        var title = string.IsNullOrWhiteSpace(advertisementTitle) ? "Advertisement" : advertisementTitle.Trim();
        string body;
        if (approved)
        {
            body = $"Your advertisement \"{title}\" has been approved and is now visible on the website.";
        }
        else if (string.IsNullOrWhiteSpace(rejectionNote))
        {
            body = $"Your advertisement \"{title}\" was rejected. Please update and resubmit.";
        }
        else
        {
            body = $"Your advertisement \"{title}\" was rejected. \"{rejectionNote.Trim()}\"";
        }

        await notificationRepository.InsertAsync(UserNotification.Create(
            teacherUserId,
            approved ? "Advertisement approved" : "Advertisement rejected",
            body,
            approved ? "teacher_advertisement_approved" : "teacher_advertisement_rejected",
            "/professor/advertisements",
            null));
        await notificationRepository.CommitAsync();

        await engagementRealtime.NotifyUserNotificationAsync(teacherUserId);
    }
}
