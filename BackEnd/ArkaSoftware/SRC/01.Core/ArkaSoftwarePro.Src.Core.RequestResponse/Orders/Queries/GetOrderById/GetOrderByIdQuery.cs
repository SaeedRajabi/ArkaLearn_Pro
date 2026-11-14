using Framework.Src.Core.RequestResponse.Endpoints;
using Framework.Src.Core.RequestResponse.Queries;

namespace ArkaSoftwarePro.Src.Core.RequestResponse.Orders.Queries.GetOrderById
{
    public class GetOrderByIdQuery : IQuery<GetOrderByIdQri>, IWebRequest
    {
        public long OrderId { get; set; }
        public string Path => "api/Service/Order/GetById";
    }
}
