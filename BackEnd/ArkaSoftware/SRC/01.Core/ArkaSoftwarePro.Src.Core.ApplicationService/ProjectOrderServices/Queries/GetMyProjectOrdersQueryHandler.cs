using ArkaSoftwarePro.Src.Core.Contracts.ProjectOrders.ProjectOrderRepositoryContracts.Queries;
using ArkaSoftwarePro.Src.Core.RequestResponse.ProjectOrders.Queries.GetMyProjectOrders;
using Framework.Src.Core.ApplicationService.Queries;
using Framework.Src.Core.RequestResponse.Common;
using Framework.Src.Core.RequestResponse.Queries;
using Framework.Src.Utilities.OutService.Services;

namespace ArkaSoftwarePro.Src.Core.ApplicationService.ProjectOrderServices.Queries;

public class GetMyProjectOrdersQueryHandler(
    ArkaSoftwareCMPOutServices outer,
    IProjectOrderQueriesRepository repository)
    : QueryHandler<GetMyProjectOrdersQuery, List<MyProjectOrderQri>>(outer)
{
    public override async Task<QueryResult<List<MyProjectOrderQri>>> Handle(GetMyProjectOrdersQuery query)
    {
        if (query.UserId <= 0)
            return await ResultAsync([], ApplicationServiceStatus.Ok);

        var items = await repository.GetMyProjectOrdersAsync(query.UserId);
        return await ResultAsync(items, ApplicationServiceStatus.Ok);
    }
}
