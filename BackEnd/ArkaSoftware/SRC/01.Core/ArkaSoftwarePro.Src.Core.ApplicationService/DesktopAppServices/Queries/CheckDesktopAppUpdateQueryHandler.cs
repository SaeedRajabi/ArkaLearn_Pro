using ArkaSoftwarePro.Src.Core.Contracts.DesktopApp.DesktopAppRepositoryContracts.Queries;
using ArkaSoftwarePro.Src.Core.RequestResponse.DesktopApp.Queries.CheckDesktopAppUpdate;
using Framework.Src.Core.ApplicationService.Queries;
using Framework.Src.Core.RequestResponse.Common;
using Framework.Src.Core.RequestResponse.Queries;
using Framework.Src.Utilities.OutService.Services;

namespace ArkaSoftwarePro.Src.Core.ApplicationService.DesktopAppServices.Queries;

public class CheckDesktopAppUpdateQueryHandler(
    ArkaSoftwareCMPOutServices outer,
    IDesktopAppQueryRepository repository)
    : QueryHandler<CheckDesktopAppUpdateQuery, DesktopAppUpdateQri>(outer)
{
    public override async Task<QueryResult<DesktopAppUpdateQri>> Handle(CheckDesktopAppUpdateQuery query)
    {
        var result = await repository.CheckUpdateAsync(query.CurrentVersion);
        return await ResultAsync(result, ApplicationServiceStatus.Ok);
    }
}
