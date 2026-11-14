using ArkaSoftwarePro.Src.Core.ApplicationService.SecurityServices;
using ArkaSoftwarePro.Src.Core.ApplicationService.UsersServices.Helpers;
using ArkaSoftwarePro.Src.Core.Contracts.UserNotifications.UserNotificationRepositoryContracts.Commands;
using ArkaSoftwarePro.Src.Core.Domain.UserNotificationAggregate.Entities;
using ArkaSoftwarePro.Src.Core.RequestResponse.Users.Commands.AdminSendUserNotifications;
using Framework.Src.Core.ApplicationService.Commands;
using Framework.Src.Core.RequestResponse.Commands;
using Framework.Src.Core.RequestResponse.Common;
using Framework.Src.Utilities.OutService.Services;
using Microsoft.AspNetCore.Http;

namespace ArkaSoftwarePro.Src.Core.ApplicationService.UsersServices.Commands;

public class AdminSendUserNotificationsCommandHandler(
    ArkaSoftwareCMPOutServices outer,
    IUserNotificationCommandRepository notificationRepository,
    IHttpContextAccessor httpContextAccessor)
    : CommandHandler<AdminSendUserNotificationsCommand, AdminSendUserNotificationsResult>(outer)
{
    public override async Task<CommandResult<AdminSendUserNotificationsResult>> Handle(AdminSendUserNotificationsCommand command)
    {
        if (!DashboardAdminRoleChecker.IsDashboardAdminRole(httpContextAccessor.HttpContext?.User))
        {
            AddMessage("Admin access required.");
            return await ResultAsync(new AdminSendUserNotificationsResult(), ApplicationServiceStatus.ValidationError);
        }

        var title = (command.Title ?? string.Empty).Trim();
        var body = (command.Body ?? string.Empty).Trim();
        if (string.IsNullOrWhiteSpace(title) || string.IsNullOrWhiteSpace(body))
        {
            AddMessage("Title and body are required.");
            return await ResultAsync(new AdminSendUserNotificationsResult(), ApplicationServiceStatus.ValidationError);
        }

        var userIds = command.UserIds?.Where(x => x > 0).Distinct().ToList() ?? [];
        if (userIds.Count == 0)
        {
            AddMessage("At least one user id is required.");
            return await ResultAsync(new AdminSendUserNotificationsResult(), ApplicationServiceStatus.ValidationError);
        }

        var notifications = userIds.Select(userId =>
            UserNotification.Create(
                userId,
                title,
                body,
                "admin_message",
                command.LinkUrl)).ToList();

        await notificationRepository.InsertManyAsync(notifications);
        await notificationRepository.CommitAsync();

        return await OkAsync(new AdminSendUserNotificationsResult { Created = notifications.Count });
    }
}
