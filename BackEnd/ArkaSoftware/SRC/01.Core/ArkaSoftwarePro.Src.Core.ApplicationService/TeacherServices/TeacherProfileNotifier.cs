using ArkaSoftwarePro.Src.Core.Contracts.Engagement;
using ArkaSoftwarePro.Src.Core.Contracts.ProjectQuestions;
using ArkaSoftwarePro.Src.Core.Contracts.SupportTickets.SupportTicketRepositoryContracts.Commands;
using ArkaSoftwarePro.Src.Core.Contracts.UserNotifications.UserNotificationRepositoryContracts.Commands;
using ArkaSoftwarePro.Src.Core.Domain.UserNotificationAggregate.Entities;

namespace ArkaSoftwarePro.Src.Core.ApplicationService.TeacherServices;

public class TeacherProfileNotifier(
    ISupportTicketCommandRepository supportTicketCommandRepository,
    IUserNotificationCommandRepository notificationRepository,
    IProjectQaRealtimeNotifier projectQaRealtime,
    IEngagementRealtimeNotifier engagementRealtime)
{
    public async Task NotifyAdminsProfileSubmittedAsync(long teacherId, string teacherDisplayName)
    {
        var adminIds = await supportTicketCommandRepository.GetAdminUserIdsAsync();
        if (adminIds.Count == 0)
            return;

        var displayName = string.IsNullOrWhiteSpace(teacherDisplayName) ? "Teacher" : teacherDisplayName.Trim();
        var notifications = adminIds.Select(userId => UserNotification.Create(
            userId,
            "Teacher profile updated",
            $"\"{displayName}\" updated their teacher profile and it is waiting for approval.",
            "teacher_profile_pending",
            $"/dashboard/teacher-approvals?teacherId={teacherId}",
            teacherId)).ToList();

        await notificationRepository.InsertManyAsync(notifications);
        await notificationRepository.CommitAsync();

        await projectQaRealtime.NotifyAdminsNotificationPulseAsync(adminIds);
    }

    public async Task NotifyTeacherProfileReviewedAsync(long teacherUserId, bool approved, string? rejectionNote)
    {
        string body;
        if (approved)
        {
            body = "Your teacher profile has been approved and is now public on the website.";
        }
        else if (string.IsNullOrWhiteSpace(rejectionNote))
        {
            body = "Your teacher profile was rejected. Please update and resubmit.";
        }
        else
        {
            body = $"Your teacher profile was rejected. \"{rejectionNote.Trim()}\"";
        }

        await notificationRepository.InsertAsync(UserNotification.Create(
            teacherUserId,
            approved ? "Profile approved" : "Profile rejected",
            body,
            approved ? "teacher_profile_approved" : "teacher_profile_rejected",
            "/professor/profile",
            null));
        await notificationRepository.CommitAsync();

        await engagementRealtime.NotifyUserNotificationAsync(teacherUserId);
    }
}
