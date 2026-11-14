using Framework.Src.Core.RequestResponse.Commands;
using Framework.Src.Core.RequestResponse.Endpoints;

namespace ArkaSoftwarePro.Src.Core.RequestResponse.Orders.Commands.CreateCarts
{
    public class CreateCartCommand:ICommand<string> , IWebRequest
    {

        public string Path => "api/Service/Order/CreateCart";
    }
}
