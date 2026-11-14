using Framework.Src.Core.RequestResponse.Commands;
using Framework.Src.Core.RequestResponse.Endpoints;

namespace ArkaSoftwarePro.Src.Core.RequestResponse.Orders.Commands.ValidateDiscountCode;

public class ValidateDiscountCodeCommand : ICommand<object>, IWebRequest
{
    public string Code { get; set; } = string.Empty;
    public decimal Subtotal { get; set; }
    /// <summary>Course ids currently in the cart (required for scoped discounts).</summary>
    public List<long>? CourseIds { get; set; }
    /// <summary>Optional line totals aligned with CourseIds; when omitted, Subtotal is split evenly for eligibility checks.</summary>
    public List<decimal>? LineTotals { get; set; }

    public string Path => "/api/Service/Order/DiscountCode/Validate";
}
