using ArkaSoftwarePro.Src.Core.Contracts.Orders.OrderRepositoryContracts.Queries;
using ArkaSoftwarePro.Src.Core.RequestResponse.Orders.Queries.GetOrderById;
using Framework.Src.Core.ApplicationService.Queries;
using Framework.Src.Core.RequestResponse.Common;
using Framework.Src.Core.RequestResponse.Queries;
using Framework.Src.Utilities.OutService.Services;

namespace ArkaSoftwarePro.Src.Core.ApplicationService.OrdersServices.Queries
{
    public class GetOrderByIdQueryHandler(
        ArkaSoftwareCMPOutServices mafiaOuterService,
        IOrderQueryRepository orderQueryRepository
        ) 
        : QueryHandler<GetOrderByIdQuery, GetOrderByIdQri>(mafiaOuterService)
    {
        public override async Task<QueryResult<GetOrderByIdQri>> Handle(GetOrderByIdQuery query)
        {
            try
            {
                var getOrderByIdResultAsync = await orderQueryRepository.GetOrderByIdAsync(query);
                if (getOrderByIdResultAsync == null!)
                    return await ResultAsync(null!, ApplicationServiceStatus.NotFound);
                return await ResultAsync(getOrderByIdResultAsync, ApplicationServiceStatus.Ok);

            }
            catch (Exception)
            {
                return await ResultAsync(null!, ApplicationServiceStatus.Exception);
            }
        }
    }
}
