using ArkaSoftwarePro.Src.Core.ApplicationService.SecurityServices;
using ArkaSoftwarePro.Src.Core.ApplicationService.UsersServices.Helpers;
using ArkaSoftwarePro.Src.Core.Contracts.GoogleAuthSettings.GoogleAuthSettingsRepositoryContracts.Commands;
using ArkaSoftwarePro.Src.Core.RequestResponse.GoogleAuthSettings.Commands.UpsertGoogleAuthSettings;
using Framework.Src.Core.ApplicationService.Commands;
using Framework.Src.Core.RequestResponse.Commands;
using Framework.Src.Core.RequestResponse.Common;
using Framework.Src.Utilities.OutService.Services;
using Microsoft.AspNetCore.Http;
using GoogleAuthSettingsEntity = ArkaSoftwarePro.Src.Core.Domain.GoogleAuthSettingsAggregate.Entities.GoogleAuthSettings;

namespace ArkaSoftwarePro.Src.Core.ApplicationService.GoogleAuthSettingsServices.Commands;

public class UpsertGoogleAuthSettingsCommandHandler(
    ArkaSoftwareCMPOutServices outer,
    IGoogleAuthSettingsCommandRepository repository,
    IHttpContextAccessor httpContextAccessor)
    : CommandHandler<UpsertGoogleAuthSettingsCommand, string>(outer)
{
    public override async Task<CommandResult<string>> Handle(UpsertGoogleAuthSettingsCommand command)
    {
        if (!DashboardAdminRoleChecker.IsDashboardAdminRole(httpContextAccessor.HttpContext?.User))
        {
            AddMessage("Admin access required.");
            return await ResultAsync("Admin access required.", ApplicationServiceStatus.ValidationError);
        }

        var clientId = command.ClientId?.Trim() ?? string.Empty;
        if (command.IsEnabled && string.IsNullOrWhiteSpace(clientId))
        {
            AddMessage("ClientId is required when Google login is enabled.");
            return await ResultAsync("ClientId is required when Google login is enabled.", ApplicationServiceStatus.ValidationError);
        }

        var current = await repository.GetCurrentAsync();
        var clientSecret = string.IsNullOrWhiteSpace(command.ClientSecret)
            ? current?.ClientSecret ?? string.Empty
            : command.ClientSecret.Trim();

        if (current is null)
        {
            current = new GoogleAuthSettingsEntity(command.IsEnabled, clientId, clientSecret);
            await repository.InsertAsync(current);
        }
        else
        {
            current.Update(command.IsEnabled, clientId, clientSecret);
        }

        await repository.CommitAsync();
        return await OkAsync("Google auth settings saved.");
    }
}
