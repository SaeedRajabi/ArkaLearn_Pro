using ArkaSoftwarePro.Src.Core.Contracts.Orders.OrderRepositoryContracts.Queries;
using ArkaSoftwarePro.Src.Core.RequestResponse.Orders.Queries.GetMyOrders;
using Framework.Src.Core.ApplicationService.Queries;
using Framework.Src.Core.RequestResponse.Common;
using Framework.Src.Core.RequestResponse.Queries;
using Framework.Src.Utilities.OutService.Services;

namespace ArkaSoftwarePro.Src.Core.ApplicationService.OrdersServices.Queries;

public class GetMyOrderQueryHandler(
    ArkaSoftwareCMPOutServices mafiaOuterService,
    IOrderQueryRepository orderQueryRepository
    )
    : QueryHandler<GetMyOrdersQuery, List<GetMyOrdersQri>>(mafiaOuterService)
{
    public override async Task<QueryResult<List<GetMyOrdersQri>>> Handle(GetMyOrdersQuery query)
    {
        try
        {
            var userOrderQueryAsync = await orderQueryRepository.GetMyOrdersAsync(query);
            if (userOrderQueryAsync == null!)
                return await ResultAsync(null!, ApplicationServiceStatus.NotFound);
            return await ResultAsync(userOrderQueryAsync , ApplicationServiceStatus.Ok);
        }
        catch (Exception e)
        {
            return await ResultAsync(null!, ApplicationServiceStatus.NotFound);

        }
    }
}