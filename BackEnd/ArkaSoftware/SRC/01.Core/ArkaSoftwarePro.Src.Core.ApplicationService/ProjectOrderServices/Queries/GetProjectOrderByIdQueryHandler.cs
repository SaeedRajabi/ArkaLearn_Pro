using ArkaSoftwarePro.Src.Core.Contracts.ProjectOrders.ProjectOrderRepositoryContracts.Queries;
using ArkaSoftwarePro.Src.Core.RequestResponse.ProjectOrders.Queries.GetProjectOrderById;
using Framework.Src.Core.ApplicationService.Queries;
using Framework.Src.Core.RequestResponse.Common;
using Framework.Src.Core.RequestResponse.Queries;
using Framework.Src.Utilities.OutService.Services;

namespace ArkaSoftwarePro.Src.Core.ApplicationService.ProjectOrderServices.Queries;

public class GetProjectOrderByIdQueryHandler(
    ArkaSoftwareCMPOutServices outer,
    IProjectOrderQueriesRepository repository)
    : QueryHandler<GetProjectOrderByIdQuery, ProjectOrderQri>(outer)
{
    public override async Task<QueryResult<ProjectOrderQri>> Handle(GetProjectOrderByIdQuery query)
    {
        var item = await repository.GetProjectOrderByIdAsync(query);
        if (item == null)
            return await ResultAsync(null!, ApplicationServiceStatus.NotFound);

        return await ResultAsync(item, ApplicationServiceStatus.Ok);
    }
}
