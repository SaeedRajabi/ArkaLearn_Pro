using ArkaSoftwarePro.Src.Core.Contracts.Projects.ProjectRepositoryContracts.Commands;
using ArkaSoftwarePro.Src.Core.Contracts.Services;
using ArkaSoftwarePro.Src.Core.Domain.ArticleAggregate.ValueOBJs;
using ArkaSoftwarePro.Src.Core.Domain.ProjectAggregate.Entities;
using ArkaSoftwarePro.Src.Core.Domain.ProjectAggregate.ValueOBJs;
using ArkaSoftwarePro.Src.Core.RequestResponse.Projects.Commands.AddProject;
using Framework.Src.Core.ApplicationService.Commands;
using Framework.Src.Core.RequestResponse.Commands;
using Framework.Src.Core.RequestResponse.Common;
using Framework.Src.Utilities.OutService.Extensions;
using Framework.Src.Utilities.OutService.Services;
using Microsoft.AspNetCore.Http;
using System.Security.Claims;

namespace ArkaSoftwarePro.Src.Core.ApplicationService.ProjectsServices.Commands;

public class AddProjectCommandHandler(
    ArkaSoftwareCMPOutServices mafiaOuterServices,
    IProjectCommandRepository projectCommandRepository,
    IHttpContextAccessor httpContextAccessor,
    IEntityTitleUniquenessChecker titleUniquenessChecker,
    ArkaSoftwarePro.Src.Core.ApplicationService.FileStorage.FileStoragePathSaver fileStoragePathSaver)
    : CommandHandler<AddProject, string>(mafiaOuterServices)
{
    public override async Task<CommandResult<string>> Handle(AddProject command)
    {
        var userIdClaim = httpContextAccessor.HttpContext?.User?.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (string.IsNullOrEmpty(userIdClaim) || !long.TryParse(userIdClaim, out var authorUserId))
            return await ResultAsync("User Is Not Defined.", ApplicationServiceStatus.NotFound);

        if (await titleUniquenessChecker.ProjectTitleExistsAsync(command.Title))
        {
            AddMessage("A project with this title already exists.");
            return await ResultAsync(string.Empty, ApplicationServiceStatus.Exist);
        }

        string? thumbnailUrl = null;
        if (command.ThumbnailUrl != null && command.ThumbnailUrl.Length > 0)
        {
            thumbnailUrl = await fileStoragePathSaver.SavePublicAsync(command.ThumbnailUrl, "images/projects");
        }

        var technologiesJson = ProjectJsonHelper.SerializeStringList(ProjectJsonHelper.ParseStringList(command.TechnologiesJson));
        var galleryJson = string.IsNullOrWhiteSpace(command.GalleryJson) ? "[]" : command.GalleryJson;

        var project = new Project(
            new ProjectTitle(command.Title),
            new Slug(command.Slug),
            new ProjectShortDescription(command.ShortDescription),
            new ProjectLongDescription(command.LongDescription),
            thumbnailUrl,
            command.IntroVideoUrl,
            command.GitHubUrl,
            command.ProjectUrl,
            technologiesJson,
            galleryJson,
            authorUserId,
            command.IsPublished);

        project.UpdateSeo(command.SeoTitle, command.MetaDescription, command.OgImageUrl);

        var tagNames = ProjectJsonHelper.ParseTagNames(command.TagsJson);

        await projectCommandRepository.InsertAsync(project);
        await projectCommandRepository.CommitAsync();
        await projectCommandRepository.SyncTagsAsync(project.Id, tagNames);
        await projectCommandRepository.CommitAsync();
        return await OkAsync(project.Id.ToString());
    }
}
