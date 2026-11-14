using ArkaSoftwarePro.Src.Core.ApplicationService.SecurityServices;
using ArkaSoftwarePro.Src.Core.ApplicationService.UsersServices.Helpers;

using ArkaSoftwarePro.Src.Core.Contracts.DesktopApp.DesktopAppRepositoryContracts.Queries;

using ArkaSoftwarePro.Src.Core.RequestResponse.DesktopApp.Queries.GetDesktopAppReleases;

using Framework.Src.Core.ApplicationService.Queries;

using Framework.Src.Core.RequestResponse.Common;

using Framework.Src.Core.RequestResponse.Queries;

using Framework.Src.Utilities.OutService.Services;

using Microsoft.AspNetCore.Http;



namespace ArkaSoftwarePro.Src.Core.ApplicationService.DesktopAppServices.Queries;



public class GetDesktopAppReleasesQueryHandler(

    ArkaSoftwareCMPOutServices outer,

    IDesktopAppQueryRepository repository,

    IHttpContextAccessor httpContextAccessor)

    : QueryHandler<GetDesktopAppReleasesQuery, List<DesktopAppReleaseAdminQri>>(outer)

{

    public override async Task<QueryResult<List<DesktopAppReleaseAdminQri>>> Handle(GetDesktopAppReleasesQuery query)

    {

        if (!DashboardAdminRoleChecker.IsDashboardAdminRole(httpContextAccessor.HttpContext?.User))

        {

            AddMessage("Admin access required.");

            return await ResultAsync([], ApplicationServiceStatus.ValidationError);

        }



        var items = await repository.ListReleasesAsync();

        return await ResultAsync(items, ApplicationServiceStatus.Ok);

    }

}
