using ArkaSoftwarePro.Src.Core.ApplicationService.SecurityServices;
using ArkaSoftwarePro.Src.Core.ApplicationService.UsersServices.Helpers;
using ArkaSoftwarePro.Src.Core.Contracts.EmailSettings.EmailSettingsRepositoryContracts.Commands;
using ArkaSoftwarePro.Src.Core.RequestResponse.EmailSettings.Commands.UpsertEmailSettings;
using Framework.Src.Core.ApplicationService.Commands;
using Framework.Src.Core.RequestResponse.Commands;
using Framework.Src.Core.RequestResponse.Common;
using Framework.Src.Utilities.OutService.Services;
using Microsoft.AspNetCore.Http;
using EmailSettingsEntity = ArkaSoftwarePro.Src.Core.Domain.EmailSettingsAggregate.Entities.EmailSettings;

namespace ArkaSoftwarePro.Src.Core.ApplicationService.EmailSettingsServices.Commands;

public class UpsertEmailSettingsCommandHandler(
    ArkaSoftwareCMPOutServices outer,
    IEmailSettingsCommandRepository repository,
    IHttpContextAccessor httpContextAccessor)
    : CommandHandler<UpsertEmailSettingsCommand, string>(outer)
{
    public override async Task<CommandResult<string>> Handle(UpsertEmailSettingsCommand command)
    {
        if (!DashboardAdminRoleChecker.IsDashboardAdminRole(httpContextAccessor.HttpContext?.User))
        {
            AddMessage("Admin access required.");
            return await ResultAsync("Admin access required.", ApplicationServiceStatus.ValidationError);
        }

        var current = await repository.GetCurrentAsync();
        var password = string.IsNullOrWhiteSpace(command.Password)
            ? current?.Password ?? string.Empty
            : command.Password.Trim();

        if (current is null)
        {
            current = new EmailSettingsEntity(
                command.IsEnabled,
                command.Host,
                command.Port,
                command.UseSsl,
                command.UseStartTls,
                command.AllowInvalidCertificate,
                command.Username ?? string.Empty,
                password,
                command.FromEmail,
                command.FromName,
                command.TimeoutSeconds,
                command.RequireEmailVerification,
                command.OtpExpiryMinutes,
                command.OtpResendCooldownSeconds,
                command.PasswordResetLinkExpiryMinutes,
                command.PasswordChangeUseSms);
            await repository.InsertAsync(current);
        }
        else
        {
            current.Update(
                command.IsEnabled,
                command.Host,
                command.Port,
                command.UseSsl,
                command.UseStartTls,
                command.AllowInvalidCertificate,
                command.Username ?? string.Empty,
                password,
                command.FromEmail,
                command.FromName,
                command.TimeoutSeconds,
                command.RequireEmailVerification,
                command.OtpExpiryMinutes,
                command.OtpResendCooldownSeconds,
                command.PasswordResetLinkExpiryMinutes,
                command.PasswordChangeUseSms);
        }

        await repository.CommitAsync();
        return await OkAsync("Email settings saved.");
    }
}
