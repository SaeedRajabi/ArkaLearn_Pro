using ArkaSoftwarePro.Src.Core.ApplicationService.SecurityServices;
using ArkaSoftwarePro.Src.Core.ApplicationService.UsersServices.Helpers;
using ArkaSoftwarePro.Src.Core.Contracts.DesktopApp.DesktopAppRepositoryContracts.Commands;
using ArkaSoftwarePro.Src.Core.Contracts.FileStorage;
using ArkaSoftwarePro.Src.Core.Contracts.MediaAssets.MediaAssetRepositoryContracts.Commands;
using ArkaSoftwarePro.Src.Core.RequestResponse.DesktopApp.Commands.DeleteDesktopAppRelease;
using Framework.Src.Core.ApplicationService.Commands;
using Framework.Src.Core.RequestResponse.Commands;
using Framework.Src.Core.RequestResponse.Common;
using Framework.Src.Utilities.OutService.Services;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Logging;

namespace ArkaSoftwarePro.Src.Core.ApplicationService.DesktopAppServices.Commands;

public class DeleteDesktopAppReleaseCommandHandler(
    ArkaSoftwareCMPOutServices outer,
    IDesktopAppCommandRepository repository,
    IMediaAssetCommandRepository mediaAssetRepository,
    IFileStorage fileStorage,
    IHttpContextAccessor httpContextAccessor,
    ILogger<DeleteDesktopAppReleaseCommandHandler> logger)
    : CommandHandler<DeleteDesktopAppReleaseCommand, string>(outer)
{
    public override async Task<CommandResult<string>> Handle(
        DeleteDesktopAppReleaseCommand command)
    {
        if (!DashboardAdminRoleChecker.IsDashboardAdminRole(httpContextAccessor.HttpContext?.User))
            return await ResultAsync("Admin access required.", ApplicationServiceStatus.ValidationError);

        if (command.ReleaseId <= 0)
            return await ResultAsync("Invalid release.", ApplicationServiceStatus.ValidationError);

        var release = await repository.GetByIdIncludingDeletedAsync(command.ReleaseId);
        if (release is null)
            return await ResultAsync("Release not found.", ApplicationServiceStatus.NotFound);

        var installerUrl = release.InstallerUrl;

        // Hard delete so the unique Version constraint can be reused.
        repository.Delete(release);
        await repository.CommitAsync();

        await TryDeleteInstallerArtifactsAsync(installerUrl);

        return await OkAsync("Release deleted.");
    }

    private async Task TryDeleteInstallerArtifactsAsync(string? installerUrl)
    {
        if (string.IsNullOrWhiteSpace(installerUrl))
            return;

        try
        {
            var objectKey = fileStorage.ToObjectKey(installerUrl.Trim(), FileAccessTier.Public);
            if (!string.IsNullOrWhiteSpace(objectKey))
            {
                await fileStorage.DeleteAsync(objectKey);
            }
        }
        catch (Exception ex)
        {
            logger.LogWarning(ex, "Failed to delete desktop installer object for URL {InstallerUrl}", installerUrl);
        }

        try
        {
            var asset = await mediaAssetRepository.FindActiveByFileUrlAsync(installerUrl);
            if (asset is not null)
            {
                asset.SoftDelete();
                await mediaAssetRepository.CommitAsync();
            }
        }
        catch (Exception ex)
        {
            logger.LogWarning(ex, "Failed to soft-delete media asset for installer URL {InstallerUrl}", installerUrl);
        }
    }
}
