using ArkaSoftwarePro.Src.Core.Contracts.SiteAnnouncement.SiteAnnouncementRepositoryContracts.Commands;
using ArkaSoftwarePro.Src.Core.Domain.SiteAnnouncementAggregate.Entities;
using ArkaSoftwarePro.Src.Core.RequestResponse.SiteAnnouncement.Commands.UpsertSiteAnnouncement;
using Framework.Src.Core.ApplicationService.Commands;
using Framework.Src.Core.RequestResponse.Commands;
using Framework.Src.Utilities.OutService.Extensions;
using Framework.Src.Utilities.OutService.Services;
using Microsoft.AspNetCore.Http;

namespace ArkaSoftwarePro.Src.Core.ApplicationService.SiteAnnouncementServices.Commands;

public class UpsertSiteAnnouncementCommandHandler(
    ArkaSoftwareCMPOutServices mafiaOuterServices,
    ISiteAnnouncementCommandRepository siteAnnouncementCommandRepository,
    ArkaSoftwarePro.Src.Core.ApplicationService.FileStorage.FileStoragePathSaver fileStoragePathSaver)
    : CommandHandler<UpsertSiteAnnouncementCommand, string>(mafiaOuterServices)
{
    public override async Task<CommandResult<string>> Handle(UpsertSiteAnnouncementCommand command)
    {
        var current = await siteAnnouncementCommandRepository.GetCurrentAsync();
        var backgroundImageUrl = await ResolveBackgroundImageAsync(
            command.BackgroundImageFile,
            command.BackgroundImageUrl,
            command.ClearBackgroundImage,
            current?.BackgroundImageUrl);

        var backgroundType = (SiteAnnouncementBackgroundType)command.BackgroundType;

        if (current is null)
        {
            current = new SiteAnnouncement(
                command.IsEnabled,
                command.ContentHtml,
                command.TextColor,
                backgroundType,
                command.BackgroundColor,
                command.GradientStartColor,
                command.GradientEndColor,
                command.GradientAngle,
                backgroundImageUrl);

            await siteAnnouncementCommandRepository.InsertAsync(current);
            await siteAnnouncementCommandRepository.CommitAsync();
            return await OkAsync("Site announcement created successfully.");
        }

        current.Update(
            command.IsEnabled,
            command.ContentHtml,
            command.TextColor,
            backgroundType,
            command.BackgroundColor,
            command.GradientStartColor,
            command.GradientEndColor,
            command.GradientAngle,
            backgroundImageUrl);

        await siteAnnouncementCommandRepository.CommitAsync();
        return await OkAsync("Site announcement updated successfully.");
    }

    private async Task<string> ResolveBackgroundImageAsync(
        IFormFile? newFile,
        string? payloadImageUrl,
        bool clearImage,
        string? currentImageUrl)
    {
        if (clearImage)
            return string.Empty;

        if (newFile != null && newFile.Length > 0)
            return await fileStoragePathSaver.SavePublicAsync(newFile, "images/site-announcement");

        if (!string.IsNullOrWhiteSpace(payloadImageUrl))
            return payloadImageUrl.Trim();

        return currentImageUrl ?? string.Empty;
    }
}
