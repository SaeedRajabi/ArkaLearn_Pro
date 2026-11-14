using ArkaSoftwarePro.Src.Core.Contracts.UserNotifications.UserNotificationRepositoryContracts.Commands;
using ArkaSoftwarePro.Src.Core.RequestResponse.UserNotifications.Commands.DeleteNotification;
using Framework.Src.Core.ApplicationService.Commands;
using Framework.Src.Core.RequestResponse.Commands;
using Framework.Src.Core.RequestResponse.Common;
using Framework.Src.Utilities.OutService.Services;

namespace ArkaSoftwarePro.Src.Core.ApplicationService.UserNotificationServices.Commands;

public class DeleteNotificationCommandHandler(
    ArkaSoftwareCMPOutServices outer,
    IUserNotificationCommandRepository repository)
    : CommandHandler<DeleteNotificationCommand, string>(outer)
{
    public override async Task<CommandResult<string>> Handle(DeleteNotificationCommand command)
    {
        var notification = await repository.GetGraphAsync(command.NotificationId);
        if (notification == null || notification.IsDelete || notification.UserId != command.UserId)
            return await ResultAsync("Notification not found.", ApplicationServiceStatus.NotFound);

        notification.Remove();
        await repository.CommitAsync();
        return await OkAsync("Notification deleted.");
    }
}
