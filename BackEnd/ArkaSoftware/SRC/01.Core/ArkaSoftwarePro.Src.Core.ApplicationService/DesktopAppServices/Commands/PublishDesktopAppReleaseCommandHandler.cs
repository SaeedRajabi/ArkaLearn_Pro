using ArkaSoftwarePro.Src.Core.ApplicationService.SecurityServices;
using ArkaSoftwarePro.Src.Core.ApplicationService.UsersServices.Helpers;

using ArkaSoftwarePro.Src.Core.Contracts.DesktopApp.DesktopAppRepositoryContracts.Commands;

using ArkaSoftwarePro.Src.Core.Domain.DesktopAppReleaseAggregate.Entities;

using ArkaSoftwarePro.Src.Core.RequestResponse.DesktopApp.Commands.PublishDesktopAppRelease;

using Framework.Src.Core.ApplicationService.Commands;

using Framework.Src.Core.RequestResponse.Commands;

using Framework.Src.Core.RequestResponse.Common;

using Framework.Src.Utilities.OutService.Services;

using Microsoft.AspNetCore.Http;

using System.Security.Claims;



namespace ArkaSoftwarePro.Src.Core.ApplicationService.DesktopAppServices.Commands;



public class PublishDesktopAppReleaseCommandHandler(

    ArkaSoftwareCMPOutServices outer,

    IDesktopAppCommandRepository repository,

    IHttpContextAccessor httpContextAccessor)

    : CommandHandler<PublishDesktopAppReleaseCommand, long>(outer)

{

    public override async Task<CommandResult<long>> Handle(PublishDesktopAppReleaseCommand command)

    {

        if (!DashboardAdminRoleChecker.IsDashboardAdminRole(httpContextAccessor.HttpContext?.User))

            return await ResultAsync(default(long), ApplicationServiceStatus.ValidationError);



        if (string.IsNullOrWhiteSpace(command.Version))

        {

            AddMessage("Version is required.");

            return await ResultAsync(default(long), ApplicationServiceStatus.ValidationError);

        }



        if (string.IsNullOrWhiteSpace(command.InstallerUrl))

        {

            AddMessage("Installer URL is required.");

            return await ResultAsync(default(long), ApplicationServiceStatus.ValidationError);

        }



        if (!Uri.TryCreate(command.InstallerUrl.Trim(), UriKind.Absolute, out _))

        {

            AddMessage("Installer URL must be a valid absolute URL.");

            return await ResultAsync(default(long), ApplicationServiceStatus.ValidationError);

        }



        if (await repository.VersionExistsAsync(command.Version))
        {
            AddMessage("This version already exists.");
            return await ResultAsync(default(long), ApplicationServiceStatus.ValidationError);
        }

        await repository.PurgeSoftDeletedByVersionAsync(command.Version);

        TryGetUserId(out var adminUserId);



        var release = DesktopAppRelease.Create(

            command.Version,

            command.InstallerUrl,

            command.ReleaseNotes,

            command.IsMandatory,

            command.MinSupportedVersion,

            adminUserId > 0 ? adminUserId : null);



        await repository.InsertReleaseAsync(release);

        await repository.CommitAsync();

        return await OkAsync(release.Id);

    }



    private bool TryGetUserId(out long userId)

    {

        userId = 0;

        var claim = httpContextAccessor.HttpContext?.User?.Claims?.FirstOrDefault(x =>

            x.Type == ClaimTypes.NameIdentifier || x.Type == "userId" || x.Type == "nameid");

        return claim != null && long.TryParse(claim.Value, out userId) && userId > 0;

    }

}
