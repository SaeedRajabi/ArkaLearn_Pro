using ArkaSoftwarePro.Src.Core.ApplicationService.SecurityServices;
using ArkaSoftwarePro.Src.Core.ApplicationService.UsersServices.Helpers;
using ArkaSoftwarePro.Src.Core.Contracts.LiveMediaTransportSettings.LiveMediaTransportSettingsRepositoryContracts.Commands;
using ArkaSoftwarePro.Src.Core.Contracts.Security;
using ArkaSoftwarePro.Src.Core.RequestResponse.LiveMediaTransportSettings.Commands.UpsertLiveMediaTransportSettings;
using Framework.Src.Core.ApplicationService.Commands;
using Framework.Src.Core.RequestResponse.Commands;
using Framework.Src.Core.RequestResponse.Common;
using Framework.Src.Utilities.OutService.Services;
using Microsoft.AspNetCore.Http;
using LiveMediaTransportSettingsEntity = ArkaSoftwarePro.Src.Core.Domain.LiveMediaTransportSettingsAggregate.Entities.LiveMediaTransportSettings;

namespace ArkaSoftwarePro.Src.Core.ApplicationService.LiveMediaTransportSettingsServices.Commands;

public class UpsertLiveMediaTransportSettingsCommandHandler(
    ArkaSoftwareCMPOutServices outer,
    ILiveMediaTransportSettingsCommandRepository repository,
    ISecretProtector secretProtector,
    IHttpContextAccessor httpContextAccessor)
    : CommandHandler<UpsertLiveMediaTransportSettingsCommand, string>(outer)
{
    public override async Task<CommandResult<string>> Handle(UpsertLiveMediaTransportSettingsCommand command)
    {
        if (!DashboardAdminRoleChecker.IsDashboardAdminRole(httpContextAccessor.HttpContext?.User))
        {
            AddMessage("Admin access required.");
            return await ResultAsync("Admin access required.", ApplicationServiceStatus.ValidationError);
        }

        if ((!string.IsNullOrWhiteSpace(command.LiveKitApiSecret) ||
             !string.IsNullOrWhiteSpace(command.TurnPassword)) && !secretProtector.HasConfiguredMasterKey)
        {
            const string error = "A valid server master key is required to encrypt live media credentials.";
            AddMessage(error);
            return await ResultAsync(error, ApplicationServiceStatus.ValidationError);
        }

        var mode = LiveMediaTransportSettingsEntity.NormalizeMode(command.TransportMode);
        if (mode == LiveMediaTransportSettingsEntity.ModeLiveKit)
        {
            if (string.IsNullOrWhiteSpace(command.LiveKitUrl))
            {
                const string error = "LiveKit URL is required when transport mode is LiveKit.";
                AddMessage(error);
                return await ResultAsync(error, ApplicationServiceStatus.ValidationError);
            }
            if (string.IsNullOrWhiteSpace(command.LiveKitApiKey))
            {
                const string error = "LiveKit API key is required when transport mode is LiveKit.";
                AddMessage(error);
                return await ResultAsync(error, ApplicationServiceStatus.ValidationError);
            }
        }

        var current = await repository.GetCurrentAsync();
        var nextSecret = current?.LiveKitApiSecretEncrypted;
        if (command.LiveKitApiSecret is not null)
        {
            nextSecret = string.IsNullOrWhiteSpace(command.LiveKitApiSecret)
                ? null
                : secretProtector.Protect(command.LiveKitApiSecret.Trim());
        }

        if (mode == LiveMediaTransportSettingsEntity.ModeLiveKit &&
            string.IsNullOrWhiteSpace(nextSecret))
        {
            const string error = "LiveKit API secret is required when transport mode is LiveKit.";
            AddMessage(error);
            return await ResultAsync(error, ApplicationServiceStatus.ValidationError);
        }

        var nextTurnPassword = current?.TurnPasswordEncrypted;
        if (command.TurnPassword is not null)
        {
            nextTurnPassword = string.IsNullOrWhiteSpace(command.TurnPassword)
                ? null
                : secretProtector.Protect(command.TurnPassword.Trim());
        }

        var turnUrl = command.TurnUrl?.Trim();
        var turnUsername = command.TurnUsername?.Trim();
        if (string.IsNullOrWhiteSpace(turnUrl) || string.IsNullOrWhiteSpace(turnUsername))
        {
            // Half-configured TURN is worse than no TURN: clear the credential too.
            turnUrl = null;
            turnUsername = null;
            nextTurnPassword = null;
        }

        if (current is null)
        {
            current = new LiveMediaTransportSettingsEntity(
                mode,
                command.LiveKitUrl,
                command.LiveKitApiKey,
                nextSecret,
                turnUrl,
                turnUsername,
                nextTurnPassword,
                command.StunUrls);
            await repository.InsertAsync(current);
        }
        else
        {
            current.Update(mode, command.LiveKitUrl, command.LiveKitApiKey, nextSecret, turnUrl, turnUsername, nextTurnPassword, command.StunUrls);
        }

        await repository.CommitAsync();
        return await OkAsync("Live media transport settings saved.");
    }
}
