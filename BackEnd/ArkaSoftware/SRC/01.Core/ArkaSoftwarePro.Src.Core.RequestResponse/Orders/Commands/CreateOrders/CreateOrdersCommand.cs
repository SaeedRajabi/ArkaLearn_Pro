using Framework.Src.Core.RequestResponse.Commands;
using Framework.Src.Core.RequestResponse.Endpoints;

namespace ArkaSoftwarePro.Src.Core.RequestResponse.Orders.Commands.CreateOrders
{
    public class CreateOrdersCommand:ICommand<string> , IWebRequest
    {
        public string Path => "/api/Service/Order/Add";
        public long UserId { get; set; }
    }
}
