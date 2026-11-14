using ArkaSoftwarePro.Src.Core.ApplicationService.DesktopDrmServices.Helpers;
using ArkaSoftwarePro.Src.Core.Contracts.DesktopDrm.DesktopDrmRepositoryContracts.Commands;
using ArkaSoftwarePro.Src.Core.Domain.DesktopDrmAggregate.Entities;
using ArkaSoftwarePro.Src.Core.RequestResponse.DesktopDrm.Commands.RegisterDesktopDevice;
using Framework.Src.Core.ApplicationService.Commands;
using Framework.Src.Core.RequestResponse.Commands;
using Framework.Src.Core.RequestResponse.Common;
using Framework.Src.Utilities.OutService.Services;

namespace ArkaSoftwarePro.Src.Core.ApplicationService.DesktopDrmServices.Commands;

public class RegisterDesktopDeviceCommandHandler(
    ArkaSoftwareCMPOutServices outer,
    IDesktopDrmCommandRepository repository,
    DesktopAccessEvaluator accessEvaluator)
    : CommandHandler<RegisterDesktopDeviceCommand, DesktopAccessStatusQri>(outer)
{
    public override async Task<CommandResult<DesktopAccessStatusQri>> Handle(RegisterDesktopDeviceCommand command)
    {
        if (command.UserId <= 0 || string.IsNullOrWhiteSpace(command.DeviceId))
            return await ResultAsync(new DesktopAccessStatusQri { IsAllowed = false }, ApplicationServiceStatus.ValidationError);

        var deviceId = command.DeviceId.Trim();

        // Authenticated login takes over exclusive session (needed after Windows reinstall when
        // the previous DeviceId still holds HasActiveLogin and the user cannot logout from it).
        var existing = await repository.GetDeviceRegistrationAsync(command.UserId, deviceId);
        if (existing is null)
        {
            var created = DesktopDeviceRegistration.Register(
                command.UserId,
                deviceId,
                command.MachineName,
                command.OsVersion,
                command.AppVersion);
            created.ActivateLogin(command.AppVersion);
            await repository.InsertDeviceRegistrationAsync(created);
        }
        else
        {
            if (existing.IsBlocked)
            {
                return await OkAsync(new DesktopAccessStatusQri
                {
                    IsAllowed = false,
                    IsDeviceBlocked = true,
                    BlockReason = "این دستگاه توسط مدیر مسدود شده است.",
                    DeviceRegistrationId = existing.Id,
                });
            }

            existing.ActivateLogin(command.AppVersion);
        }

        await repository.DeactivateOtherActiveLoginsAsync(command.UserId, deviceId);
        await repository.CommitAsync();

        var status = await accessEvaluator.EvaluateAsync(command.UserId, deviceId, checkVideoPlayback: false);
        return await OkAsync(status);
    }
}
