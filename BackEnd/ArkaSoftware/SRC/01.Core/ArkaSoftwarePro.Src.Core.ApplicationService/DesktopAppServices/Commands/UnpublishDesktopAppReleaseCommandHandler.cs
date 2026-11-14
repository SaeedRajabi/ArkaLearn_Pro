using ArkaSoftwarePro.Src.Core.ApplicationService.SecurityServices;
using ArkaSoftwarePro.Src.Core.ApplicationService.UsersServices.Helpers;

using ArkaSoftwarePro.Src.Core.Contracts.DesktopApp.DesktopAppRepositoryContracts.Commands;

using ArkaSoftwarePro.Src.Core.RequestResponse.DesktopApp.Commands.UnpublishDesktopAppRelease;

using Framework.Src.Core.ApplicationService.Commands;

using Framework.Src.Core.RequestResponse.Commands;

using Framework.Src.Core.RequestResponse.Common;

using Framework.Src.Utilities.OutService.Services;

using Microsoft.AspNetCore.Http;



namespace ArkaSoftwarePro.Src.Core.ApplicationService.DesktopAppServices.Commands;



public class UnpublishDesktopAppReleaseCommandHandler(

    ArkaSoftwareCMPOutServices outer,

    IDesktopAppCommandRepository repository,

    IHttpContextAccessor httpContextAccessor)

    : CommandHandler<UnpublishDesktopAppReleaseCommand, string>(outer)

{

    public override async Task<CommandResult<string>> Handle(UnpublishDesktopAppReleaseCommand command)

    {

        if (!DashboardAdminRoleChecker.IsDashboardAdminRole(httpContextAccessor.HttpContext?.User))

            return await ResultAsync("Admin access required.", ApplicationServiceStatus.ValidationError);



        if (command.ReleaseId <= 0)

        {

            AddMessage("Release id is required.");

            return await ResultAsync("Invalid release.", ApplicationServiceStatus.ValidationError);

        }



        var release = await repository.GetByIdAsync(command.ReleaseId);

        if (release is null)

            return await ResultAsync("Release not found.", ApplicationServiceStatus.NotFound);



        release.Unpublish();

        await repository.CommitAsync();

        return await OkAsync("Release unpublished.");

    }

}
