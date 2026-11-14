using ArkaSoftwarePro.Src.Core.Contracts.Engagement;
using ArkaSoftwarePro.Src.Core.Contracts.ManagedRoomStudents.ManagedRoomStudentRepositoryContracts.Commands;
using ArkaSoftwarePro.Src.Core.Contracts.UserNotifications.UserNotificationRepositoryContracts.Commands;
using ArkaSoftwarePro.Src.Core.Contracts.Users.UserRepositoryContracts.Queries;
using ArkaSoftwarePro.Src.Core.Domain.UserNotificationAggregate.Entities;
using ArkaSoftwarePro.Src.Core.RequestResponse.Users.Queries.GetById;

namespace ArkaSoftwarePro.Src.Core.ApplicationService.EducationPlanServices;

public class EducationPlanNotifier(
    IManagedRoomStudentCommandRepository managedRoomStudentRepository,
    IUserQueryRepository userQueryRepository,
    IUserNotificationCommandRepository notificationRepository,
    IEngagementRealtimeNotifier engagementRealtime)
{
    public Task NotifyPlanAssignedAsync(
        long planId,
        long managedRoomStudentId,
        string planTitle,
        long ownerUserId,
        CancellationToken cancellationToken = default) =>
        NotifyStudentAsync(
            planId,
            managedRoomStudentId,
            planTitle,
            ownerUserId,
            "education_plan_assigned",
            "New education plan",
            BuildAssignedBody,
            cancellationToken);

    public Task NotifyPlanRemovedAsync(
        long planId,
        long managedRoomStudentId,
        string planTitle,
        long ownerUserId,
        CancellationToken cancellationToken = default) =>
        NotifyStudentAsync(
            planId,
            managedRoomStudentId,
            planTitle,
            ownerUserId,
            "education_plan_removed",
            "Education plan removed",
            BuildRemovedBody,
            cancellationToken);

    public Task NotifyInstallmentDueAsync(
        long planId,
        long managedRoomStudentId,
        string planTitle,
        int installmentNumber,
        decimal amountToman,
        DateTime dueDateUtc,
        CancellationToken cancellationToken = default) =>
        NotifyStudentWithCustomBodyAsync(
            planId,
            managedRoomStudentId,
            planTitle,
            0,
            "education_plan_installment_due",
            "Installment payment reminder",
            BuildInstallmentDueBody(planTitle, installmentNumber, amountToman, dueDateUtc),
            cancellationToken);

    private async Task NotifyStudentWithCustomBodyAsync(
        long planId,
        long managedRoomStudentId,
        string planTitle,
        long ownerUserId,
        string type,
        string title,
        string body,
        CancellationToken cancellationToken)
    {
        var student = await managedRoomStudentRepository.GetByIdOrDefaultAsync(managedRoomStudentId);
        if (student is null)
            return;

        var contact = await userQueryRepository.GetUserLookupByIdentityAsync(
            student.UserName.Value,
            student.Email,
            cancellationToken);
        if (contact is not { UserId: > 0 })
            return;

        await notificationRepository.InsertAsync(UserNotification.Create(
            contact.UserId,
            title,
            body,
            type,
            "/account?view=education-plans",
            planId));
        await notificationRepository.CommitAsync();
        await engagementRealtime.NotifyUserNotificationAsync(contact.UserId);
    }

    private static string BuildInstallmentDueBody(
        string planTitle,
        int installmentNumber,
        decimal amountToman,
        DateTime dueDateUtc) =>
        $"Installment #{installmentNumber} for \"{planTitle}\" ({amountToman:N0} Toman) is due on {dueDateUtc:yyyy-MM-dd}. If unpaid, your plan and online room will be temporarily unavailable.";

    private async Task NotifyStudentAsync(
        long planId,
        long managedRoomStudentId,
        string planTitle,
        long ownerUserId,
        string type,
        string title,
        Func<string, string?, string> buildBody,
        CancellationToken cancellationToken)
    {
        var student = await managedRoomStudentRepository.GetByIdOrDefaultAsync(managedRoomStudentId);
        if (student is null)
            return;

        var contact = await userQueryRepository.GetUserLookupByIdentityAsync(
            student.UserName.Value,
            student.Email,
            cancellationToken);
        if (contact is not { UserId: > 0 })
            return;

        var normalizedTitle = string.IsNullOrWhiteSpace(planTitle) ? "Education Plan" : planTitle.Trim();
        var instructorName = await ResolveOwnerDisplayNameAsync(ownerUserId, cancellationToken);
        var body = buildBody(normalizedTitle, instructorName);

        await notificationRepository.InsertAsync(UserNotification.Create(
            contact.UserId,
            title,
            body,
            type,
            "/account?view=education-plans",
            planId));
        await notificationRepository.CommitAsync();
        await engagementRealtime.NotifyUserNotificationAsync(contact.UserId);
    }

    private static string BuildAssignedBody(string planTitle, string? instructorName) =>
        instructorName is null
            ? $"A private education plan \"{planTitle}\" has been assigned to you."
            : $"A private education plan \"{planTitle}\" has been assigned to you by instructor \"{instructorName}\".";

    private static string BuildRemovedBody(string planTitle, string? instructorName) =>
        instructorName is null
            ? $"Your private education plan \"{planTitle}\" has been removed."
            : $"Your private education plan \"{planTitle}\" from instructor \"{instructorName}\" has been removed.";

    private async Task<string?> ResolveOwnerDisplayNameAsync(long ownerUserId, CancellationToken cancellationToken)
    {
        if (ownerUserId <= 0)
            return null;

        var user = await userQueryRepository.ExecuteAsync(new GetUserByIdQuery { UserId = ownerUserId });
        var name = user?.FullName?.Trim();
        return string.IsNullOrWhiteSpace(name) ? null : name;
    }
}
