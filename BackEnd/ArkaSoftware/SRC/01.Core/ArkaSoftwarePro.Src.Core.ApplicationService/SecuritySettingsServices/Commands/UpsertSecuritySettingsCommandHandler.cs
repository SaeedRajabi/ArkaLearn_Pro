using ArkaSoftwarePro.Src.Core.ApplicationService.SecurityServices;
using ArkaSoftwarePro.Src.Core.ApplicationService.UsersServices.Helpers;
using ArkaSoftwarePro.Src.Core.Contracts.SecuritySettings.SecuritySettingsRepositoryContracts.Commands;
using ArkaSoftwarePro.Src.Core.RequestResponse.SecuritySettings.Commands.UpsertSecuritySettings;
using Framework.Src.Core.ApplicationService.Commands;
using Framework.Src.Core.RequestResponse.Commands;
using Framework.Src.Core.RequestResponse.Common;
using Framework.Src.Utilities.OutService.Services;
using Microsoft.AspNetCore.Http;
using SecuritySettingsEntity = ArkaSoftwarePro.Src.Core.Domain.SecuritySettingsAggregate.Entities.SecuritySettings;

namespace ArkaSoftwarePro.Src.Core.ApplicationService.SecuritySettingsServices.Commands;

public class UpsertSecuritySettingsCommandHandler(
    ArkaSoftwareCMPOutServices outer,
    ISecuritySettingsCommandRepository repository,
    IHttpContextAccessor httpContextAccessor)
    : CommandHandler<UpsertSecuritySettingsCommand, string>(outer)
{
    public override async Task<CommandResult<string>> Handle(UpsertSecuritySettingsCommand command)
    {
        if (!DashboardAdminRoleChecker.IsDashboardAdminRole(httpContextAccessor.HttpContext?.User))
        {
            AddMessage("Admin access required.");
            return await ResultAsync("Admin access required.", ApplicationServiceStatus.ValidationError);
        }

        var current = await repository.GetCurrentAsync();
        if (current is null)
        {
            current = new SecuritySettingsEntity(
                command.MaxLoginAttempts,
                command.LockoutMinutes,
                command.PermanentBlockAfterLockouts,
                command.IpUnblockOtpExpiryMinutes,
                command.IpUnblockOtpResendCooldownSeconds);
            await repository.InsertAsync(current);
        }
        else
        {
            current.Update(
                command.MaxLoginAttempts,
                command.LockoutMinutes,
                command.PermanentBlockAfterLockouts,
                command.IpUnblockOtpExpiryMinutes,
                command.IpUnblockOtpResendCooldownSeconds);
        }

        await repository.CommitAsync();
        return await OkAsync("Security settings saved.");
    }
}
