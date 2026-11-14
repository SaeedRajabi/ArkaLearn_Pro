using ArkaSoftwarePro.Src.Core.Contracts.Projects.ProjectRepositoryContracts.Commands;
using ArkaSoftwarePro.Src.Core.Contracts.Services;
using ArkaSoftwarePro.Src.Core.Domain.ArticleAggregate.ValueOBJs;
using ArkaSoftwarePro.Src.Core.Domain.ProjectAggregate.ValueOBJs;
using ArkaSoftwarePro.Src.Core.RequestResponse.Projects.Commands.UpdateProject;
using Framework.Src.Core.ApplicationService.Commands;
using Framework.Src.Core.RequestResponse.Commands;
using Framework.Src.Core.RequestResponse.Common;
using Framework.Src.Utilities.OutService.Services;

namespace ArkaSoftwarePro.Src.Core.ApplicationService.ProjectsServices.Commands;

public class UpdateProjectCommandHandler(
    ArkaSoftwareCMPOutServices mafiaOuterServices,
    IProjectCommandRepository projectCommandRepository,
    IEntityTitleUniquenessChecker titleUniquenessChecker)
    : CommandHandler<UpdateProject, string>(mafiaOuterServices)
{
    public override async Task<CommandResult<string>> Handle(UpdateProject command)
    {
        var project = await projectCommandRepository.GetAsync(command.Id);
        if (project == null)
            return await ResultAsync($"Project with Id {command.Id} was not found.", ApplicationServiceStatus.NotFound);

        if (await titleUniquenessChecker.ProjectTitleExistsAsync(command.Title, command.Id))
        {
            AddMessage("A project with this title already exists.");
            return await ResultAsync(string.Empty, ApplicationServiceStatus.Exist);
        }

        var thumbnailUrl = command.ThumbnailUrl;
        if (!string.IsNullOrEmpty(thumbnailUrl) &&
            (thumbnailUrl.StartsWith("data:", StringComparison.OrdinalIgnoreCase) || thumbnailUrl.Length > 500))
        {
            thumbnailUrl = null;
        }

        var technologiesJson = command.TechnologiesJson != null
            ? ProjectJsonHelper.SerializeStringList(ProjectJsonHelper.ParseStringList(command.TechnologiesJson))
            : null;

        project.UpdateContent(
            new ProjectTitle(command.Title),
            new ProjectShortDescription(command.ShortDescription),
            new ProjectLongDescription(command.LongDescription),
            thumbnailUrl,
            command.IntroVideoUrl,
            command.GitHubUrl,
            command.ProjectUrl,
            technologiesJson,
            command.GalleryJson);

        project.UpdateSeo(command.SeoTitle, command.MetaDescription, command.OgImageUrl);

        project.UpdateSlug(new Slug(command.Slug));

        if (command.IsPublished && !project.IsPublished)
            project.Publish();
        else if (!command.IsPublished && project.IsPublished)
            project.Unpublish();

        if (command.TagsJson != null)
            await projectCommandRepository.SyncTagsAsync(project.Id, ProjectJsonHelper.ParseTagNames(command.TagsJson));

        await projectCommandRepository.CommitAsync();
        return await OkAsync("Project updated successfully.");
    }
}
