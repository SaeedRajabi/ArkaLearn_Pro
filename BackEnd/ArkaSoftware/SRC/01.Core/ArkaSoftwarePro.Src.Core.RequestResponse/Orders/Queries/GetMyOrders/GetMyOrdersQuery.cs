using Framework.Src.Core.RequestResponse.Endpoints;
using Framework.Src.Core.RequestResponse.Queries;

namespace ArkaSoftwarePro.Src.Core.RequestResponse.Orders.Queries.GetMyOrders
{
    public class GetMyOrdersQuery : IQuery<List<GetMyOrdersQri>> , IWebRequest
    {
        public long UserId { get; set; }
        public string Path => "api/Service/Order/GetMyOrders";
    }
}
