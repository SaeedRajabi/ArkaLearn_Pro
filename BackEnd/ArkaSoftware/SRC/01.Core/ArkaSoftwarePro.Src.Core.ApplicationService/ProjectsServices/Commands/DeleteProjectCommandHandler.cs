using ArkaSoftwarePro.Src.Core.Contracts.Services;
using ArkaSoftwarePro.Src.Core.RequestResponse.Projects.Commands.DeleteProject;
using Framework.Src.Core.ApplicationService.Commands;
using Framework.Src.Core.RequestResponse.Commands;
using Framework.Src.Core.RequestResponse.Common;
using Framework.Src.Utilities.OutService.Services;

namespace ArkaSoftwarePro.Src.Core.ApplicationService.ProjectsServices.Commands;

public class DeleteProjectCommandHandler(
    ArkaSoftwareCMPOutServices mafiaOuterServices,
    IEntityPermanentDeletionService permanentDeletionService)
    : CommandHandler<DeleteProjectCommand, string>(mafiaOuterServices)
{
    public override async Task<CommandResult<string>> Handle(DeleteProjectCommand command)
    {
        var deleted = await permanentDeletionService.PermanentlyDeleteProjectAsync(command.Id);
        if (!deleted)
            return await ResultAsync($"Project with Id {command.Id} was not found.", ApplicationServiceStatus.NotFound);

        return await OkAsync("Project permanently deleted.");
    }
}
