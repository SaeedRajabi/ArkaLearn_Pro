using ArkaSoftwarePro.Src.Core.Contracts.ProjectQuestions;
using ArkaSoftwarePro.Src.Endpoints.API.Hubs;
using Microsoft.AspNetCore.SignalR;

namespace ArkaSoftwarePro.Src.Endpoints.API.RealTimes;

public class SignalRProjectQaNotifier(IHubContext<ProjectQaHub> hubContext) : IProjectQaRealtimeNotifier
{
    public async Task NotifyAnswerPostedAsync(long projectId, long questionId, long askerUserId)
    {
        var payload = new { projectId, questionId };

        await hubContext.Clients.Group(ProjectQaHub.ProjectGroup(projectId))
            .SendAsync("AnswerPosted", payload);

        await hubContext.Clients.Group(ProjectQaHub.UserGroup(askerUserId))
            .SendAsync("AnswerPosted", payload);

        await NotifyUserNotificationAsync(askerUserId);
    }

    public async Task NotifyQuestionSubmittedAsync(long projectId, long questionId, IReadOnlyList<long> adminUserIds)
    {
        var payload = new { projectId, questionId };

        await hubContext.Clients.Group(ProjectQaHub.AdminGroup)
            .SendAsync("QuestionSubmitted", payload);

        foreach (var adminId in adminUserIds.Distinct())
        {
            await hubContext.Clients.Group(ProjectQaHub.UserGroup(adminId))
                .SendAsync("QuestionSubmitted", payload);

            await NotifyUserNotificationAsync(adminId);
        }
    }

    public async Task NotifyQuestionReviewedAsync(long projectId, long questionId, long askerUserId, bool approved)
    {
        var payload = new { projectId, questionId, approved };

        await hubContext.Clients.Group(ProjectQaHub.ProjectGroup(projectId))
            .SendAsync("QuestionReviewed", payload);

        await hubContext.Clients.Group(ProjectQaHub.UserGroup(askerUserId))
            .SendAsync("QuestionReviewed", payload);

        await NotifyUserNotificationAsync(askerUserId);
    }

    public Task NotifyUserNotificationAsync(long userId)
    {
        return hubContext.Clients.Group(ProjectQaHub.UserGroup(userId))
            .SendAsync("NotificationPulse");
    }

    public async Task NotifyAdminsNotificationPulseAsync(IReadOnlyList<long> adminUserIds)
    {
        await hubContext.Clients.Group(ProjectQaHub.AdminGroup)
            .SendAsync("NotificationPulse");

        foreach (var adminId in adminUserIds.Distinct())
        {
            await hubContext.Clients.Group(ProjectQaHub.UserGroup(adminId))
                .SendAsync("NotificationPulse");
        }
    }
}
