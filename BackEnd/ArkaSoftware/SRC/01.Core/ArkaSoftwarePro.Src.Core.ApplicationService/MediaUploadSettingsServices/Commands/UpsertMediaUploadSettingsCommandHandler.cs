using ArkaSoftwarePro.Src.Core.ApplicationService.SecurityServices;
using ArkaSoftwarePro.Src.Core.ApplicationService.UsersServices.Helpers;
using ArkaSoftwarePro.Src.Core.Contracts.MediaUploadSettings.MediaUploadSettingsRepositoryContracts.Commands;
using ArkaSoftwarePro.Src.Core.RequestResponse.MediaUploadSettings.Commands.UpsertMediaUploadSettings;
using Framework.Src.Core.ApplicationService.Commands;
using Framework.Src.Core.RequestResponse.Commands;
using Framework.Src.Core.RequestResponse.Common;
using Framework.Src.Utilities.OutService.Services;
using Microsoft.AspNetCore.Http;
using MediaUploadSettingsEntity = ArkaSoftwarePro.Src.Core.Domain.MediaUploadSettingsAggregate.Entities.MediaUploadSettings;

namespace ArkaSoftwarePro.Src.Core.ApplicationService.MediaUploadSettingsServices.Commands;

public class UpsertMediaUploadSettingsCommandHandler(
    ArkaSoftwareCMPOutServices outer,
    IMediaUploadSettingsCommandRepository repository,
    IHttpContextAccessor httpContextAccessor)
    : CommandHandler<UpsertMediaUploadSettingsCommand, string>(outer)
{
    public override async Task<CommandResult<string>> Handle(UpsertMediaUploadSettingsCommand command)
    {
        if (!DashboardAdminRoleChecker.IsDashboardAdminRole(httpContextAccessor.HttpContext?.User))
        {
            AddMessage("Admin access required.");
            return await ResultAsync("Admin access required.", ApplicationServiceStatus.ValidationError);
        }

        if (command.CourseIntroMaxDurationMinutes is < MediaUploadSettingsEntity.MinDurationMinutes
                or > MediaUploadSettingsEntity.MaxDurationMinutes
            || command.PromotionalVideoMaxDurationMinutes is < MediaUploadSettingsEntity.MinDurationMinutes
                or > MediaUploadSettingsEntity.MaxDurationMinutes)
        {
            const string error = "Media upload duration limits must be between 1 and 120 minutes.";
            AddMessage(error);
            return await ResultAsync(error, ApplicationServiceStatus.ValidationError);
        }

        var current = await repository.GetCurrentAsync();
        if (current is null)
        {
            current = new MediaUploadSettingsEntity(
                command.CourseIntroMaxDurationMinutes,
                command.PromotionalVideoMaxDurationMinutes);
            await repository.InsertAsync(current);
        }
        else
        {
            current.Update(
                command.CourseIntroMaxDurationMinutes,
                command.PromotionalVideoMaxDurationMinutes);
        }

        await repository.CommitAsync();
        return await OkAsync("Media upload settings saved.");
    }
}
