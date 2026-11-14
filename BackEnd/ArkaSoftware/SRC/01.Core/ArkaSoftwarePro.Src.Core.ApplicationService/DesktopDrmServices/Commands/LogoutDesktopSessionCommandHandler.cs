using ArkaSoftwarePro.Src.Core.Contracts.DesktopDrm.DesktopDrmRepositoryContracts.Commands;
using ArkaSoftwarePro.Src.Core.RequestResponse.DesktopDrm.Commands.LogoutDesktopSession;
using Framework.Src.Core.ApplicationService.Commands;
using Framework.Src.Core.RequestResponse.Commands;
using Framework.Src.Core.RequestResponse.Common;
using Framework.Src.Utilities.OutService.Services;

namespace ArkaSoftwarePro.Src.Core.ApplicationService.DesktopDrmServices.Commands;

public class LogoutDesktopSessionCommandHandler(
    ArkaSoftwareCMPOutServices outer,
    IDesktopDrmCommandRepository repository)
    : CommandHandler<LogoutDesktopSessionCommand, string>(outer)
{
    public override async Task<CommandResult<string>> Handle(LogoutDesktopSessionCommand command)
    {
        if (command.UserId <= 0 || string.IsNullOrWhiteSpace(command.DeviceId))
            return await ResultAsync("invalid", ApplicationServiceStatus.ValidationError);

        var device = await repository.GetDeviceRegistrationAsync(command.UserId, command.DeviceId.Trim());
        if (device is not null && device.HasActiveLogin)
        {
            device.DeactivateLogin();
            await repository.CommitAsync();
        }

        return await OkAsync("ok");
    }
}
