using Framework.Src.Core.RequestResponse.Commands;
using Framework.Src.Core.RequestResponse.Endpoints;

namespace ArkaSoftwarePro.Src.Core.RequestResponse.Orders.Commands.DeactivateDiscountCode;

public class DeactivateDiscountCodeCommand : ICommand<object>, IWebRequest
{
    public long Id { get; set; }
    public string Path => "/api/Service/Order/DiscountCode/Deactivate";
}
