using ArkaSoftwarePro.Src.Core.Contracts.Software.SoftwareRepositoryContracts.Commands;
using ArkaSoftwarePro.Src.Core.Domain.SoftwareAggregate.Entities;
using ArkaSoftwarePro.Src.Core.Domain.TeacherAggregate.Enumerations;
using ArkaSoftwarePro.Src.Core.RequestResponse.Software.Commands.SavePlatformSoftware;
using Framework.Src.Core.ApplicationService.Commands;
using Framework.Src.Core.RequestResponse.Commands;
using Framework.Src.Core.RequestResponse.Common;
using Framework.Src.Utilities.OutService.Services;
using Microsoft.AspNetCore.Http;
using System.Security.Claims;

namespace ArkaSoftwarePro.Src.Core.ApplicationService.SoftwareServices.Commands;

public class SavePlatformSoftwareCommandHandler(
    ArkaSoftwareCMPOutServices outer,
    ISoftwareCommandRepository softwareRepository,
    IHttpContextAccessor httpContextAccessor)
    : CommandHandler<SavePlatformSoftwareCommand, long>(outer)
{
    public override async Task<CommandResult<long>> Handle(SavePlatformSoftwareCommand command)
    {
        if (!TryGetUserId(out var userId))
            return await ResultAsync(default(long), ApplicationServiceStatus.NotFound);

        if (string.IsNullOrWhiteSpace(command.Title))
        {
            result.AddMessage("Title is required.");
            return await ResultAsync(default(long), ApplicationServiceStatus.ValidationError);
        }

        var tags = command.Tags ?? [];
        long softwareId;

        if (command.SoftwareId > 0)
        {
            var existing = await softwareRepository.GetWithTeacherAsync(command.SoftwareId);
            if (existing == null || !existing.IsPlatformOwned)
                return await ResultAsync(default(long), ApplicationServiceStatus.NotFound);

            var coverImageUrl = string.IsNullOrWhiteSpace(command.CoverImageUrl)
                ? existing.CoverImageUrl
                : command.CoverImageUrl;

            string? installerFileUrl = command.InstallerFileUrl;
            string? installerFileName = command.InstallerFileName;
            if (string.IsNullOrWhiteSpace(installerFileUrl))
            {
                installerFileUrl = null;
                installerFileName = null;
            }

            existing.Update(
                command.Title,
                command.ShortDescription ?? string.Empty,
                command.LongDescriptionHtml ?? string.Empty,
                coverImageUrl,
                installerFileUrl,
                installerFileName,
                command.CategoryId,
                tags,
                command.SortOrder,
                TeacherApprovalStatus.Approved);
            existing.UpdateSeo(command.SeoTitle, command.MetaDescription, command.OgImageUrl);
            existing.EnsureSlug(existing.Id);
            softwareId = existing.Id;
        }
        else
        {
            var created = SoftwareProduct.CreatePlatform(
                userId,
                command.Title,
                command.ShortDescription ?? string.Empty,
                command.LongDescriptionHtml ?? string.Empty,
                command.CoverImageUrl,
                command.InstallerFileUrl,
                command.InstallerFileName,
                command.CategoryId,
                tags,
                command.SortOrder);
            created.UpdateSeo(command.SeoTitle, command.MetaDescription, command.OgImageUrl);
            await softwareRepository.InsertAsync(created);
            await softwareRepository.CommitAsync();
            created.EnsureSlug(created.Id);
            softwareId = created.Id;
        }

        await softwareRepository.CommitAsync();
        return await OkAsync(softwareId);
    }

    private bool TryGetUserId(out long userId)
    {
        userId = 0;
        var claim = httpContextAccessor.HttpContext?.User?.Claims?.FirstOrDefault(x =>
            x.Type == ClaimTypes.NameIdentifier || x.Type == "userId" || x.Type == "nameid");
        return claim != null && long.TryParse(claim.Value, out userId) && userId > 0;
    }
}
