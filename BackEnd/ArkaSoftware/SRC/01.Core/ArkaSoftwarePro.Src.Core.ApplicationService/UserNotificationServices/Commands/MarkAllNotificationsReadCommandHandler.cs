using ArkaSoftwarePro.Src.Core.Contracts.UserNotifications.UserNotificationRepositoryContracts.Commands;
using ArkaSoftwarePro.Src.Core.RequestResponse.UserNotifications.Commands.MarkAllNotificationsRead;
using Framework.Src.Core.ApplicationService.Commands;
using Framework.Src.Core.RequestResponse.Commands;
using Framework.Src.Core.RequestResponse.Common;
using Framework.Src.Utilities.OutService.Services;

namespace ArkaSoftwarePro.Src.Core.ApplicationService.UserNotificationServices.Commands;

public class MarkAllNotificationsReadCommandHandler(
    ArkaSoftwareCMPOutServices outer,
    IUserNotificationCommandRepository repository)
    : CommandHandler<MarkAllNotificationsReadCommand, string>(outer)
{
    public override async Task<CommandResult<string>> Handle(MarkAllNotificationsReadCommand command)
    {
        if (command.UserId <= 0)
            return await ResultAsync("User is not authenticated.", ApplicationServiceStatus.NotFound);

        await repository.MarkAllReadAsync(command.UserId);
        await repository.CommitAsync();
        return await OkAsync("All notifications marked as read.");
    }
}
