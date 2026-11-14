using ArkaSoftwarePro.Src.Core.Contracts.ProjectOrders.ProjectOrderRepositoryContracts.Queries;
using ArkaSoftwarePro.Src.Core.RequestResponse.ProjectOrders.Queries.SearchProjectOrders;
using Framework.Src.Core.ApplicationService.Queries;
using Framework.Src.Core.RequestResponse.Common;
using Framework.Src.Core.RequestResponse.Queries;
using Framework.Src.Utilities.OutService.Services;

namespace ArkaSoftwarePro.Src.Core.ApplicationService.ProjectOrderServices.Queries;

public class SearchProjectOrdersQueryHandler(
    ArkaSoftwareCMPOutServices outer,
    IProjectOrderQueriesRepository repository)
    : QueryHandler<SearchProjectOrdersQuery, PagedData<SearchProjectOrderQri>>(outer)
{
    public override async Task<QueryResult<PagedData<SearchProjectOrderQri>>> Handle(SearchProjectOrdersQuery query)
    {
        var result = await repository.SearchProjectOrdersAsync(query);
        return await ResultAsync(result ?? new PagedData<SearchProjectOrderQri>(), ApplicationServiceStatus.Ok);
    }
}
