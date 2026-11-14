using ArkaSoftwarePro.Src.Core.RequestResponse.ProjectOrders.Queries.GetMyProjectOrderById;
using ArkaSoftwarePro.Src.Core.RequestResponse.ProjectOrders.Queries.GetMyProjectOrders;
using ArkaSoftwarePro.Src.Core.RequestResponse.ProjectOrders.Queries.GetProjectOrderById;
using ArkaSoftwarePro.Src.Core.RequestResponse.ProjectOrders.Queries.SearchProjectOrders;
using Framework.Src.Core.Contracts.Data.Queries;
using Framework.Src.Core.RequestResponse.Queries;

namespace ArkaSoftwarePro.Src.Core.Contracts.ProjectOrders.ProjectOrderRepositoryContracts.Queries;

public interface IProjectOrderQueriesRepository : IQueryRepository
{
    Task<List<MyProjectOrderQri>> GetMyProjectOrdersAsync(long userId);
    Task<ProjectOrderQri?> GetMyProjectOrderByIdAsync(GetMyProjectOrderByIdQuery query);
    Task<ProjectOrderQri?> GetProjectOrderByIdAsync(GetProjectOrderByIdQuery query);
    Task<PagedData<SearchProjectOrderQri>?> SearchProjectOrdersAsync(SearchProjectOrdersQuery query);
    Task<int> GetPendingCountAsync();
}
