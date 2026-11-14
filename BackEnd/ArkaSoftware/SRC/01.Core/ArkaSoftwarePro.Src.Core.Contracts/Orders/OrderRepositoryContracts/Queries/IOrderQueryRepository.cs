using Framework.Src.Core.Contracts.Data.Queries;
using ArkaSoftwarePro.Src.Core.RequestResponse.Orders.Queries.GetMyOrders;
using ArkaSoftwarePro.Src.Core.RequestResponse.Orders.Queries.GetOrderById;

namespace ArkaSoftwarePro.Src.Core.Contracts.Orders.OrderRepositoryContracts.Queries
{
    public interface IOrderQueryRepository:IQueryRepository
    {
        Task<List<GetMyOrdersQri>> GetMyOrdersAsync(GetMyOrdersQuery query);
        Task<GetOrderByIdQri?> GetOrderByIdAsync(GetOrderByIdQuery query);
    }
}
