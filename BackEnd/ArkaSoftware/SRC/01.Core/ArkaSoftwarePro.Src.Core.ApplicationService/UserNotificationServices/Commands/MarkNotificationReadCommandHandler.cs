using ArkaSoftwarePro.Src.Core.Contracts.UserNotifications.UserNotificationRepositoryContracts.Commands;
using ArkaSoftwarePro.Src.Core.RequestResponse.UserNotifications.Commands.MarkNotificationRead;
using Framework.Src.Core.ApplicationService.Commands;
using Framework.Src.Core.RequestResponse.Commands;
using Framework.Src.Core.RequestResponse.Common;
using Framework.Src.Utilities.OutService.Services;

namespace ArkaSoftwarePro.Src.Core.ApplicationService.UserNotificationServices.Commands;

public class MarkNotificationReadCommandHandler(
    ArkaSoftwareCMPOutServices outer,
    IUserNotificationCommandRepository repository)
    : CommandHandler<MarkNotificationReadCommand, string>(outer)
{
    public override async Task<CommandResult<string>> Handle(MarkNotificationReadCommand command)
    {
        var notification = await repository.GetGraphAsync(command.NotificationId);
        if (notification == null || notification.UserId != command.UserId)
            return await ResultAsync("Notification not found.", ApplicationServiceStatus.NotFound);

        notification.MarkRead();
        await repository.CommitAsync();
        return await OkAsync("Marked as read.");
    }
}
