using ArkaSoftwarePro.Src.Core.Domain.BasketAggregate.Enumerations;
using Framework.Src.Core.RequestResponse.Commands;
using Framework.Src.Core.RequestResponse.Endpoints;

namespace ArkaSoftwarePro.Src.Core.RequestResponse.Orders.Commands.CreateDiscountCode;

public class CreateDiscountCodeCommand : ICommand<object>, IWebRequest
{
    public string Code { get; set; } = string.Empty;
    public decimal Amount { get; set; }
    public byte DiscountType { get; set; } = 2; // PERCENTAGE
    public DateTime? ExpirationDate { get; set; }
    /// <summary>Optional relative duration. Used when ExpirationDate is null.</summary>
    public int? DurationValue { get; set; }
    /// <summary>hours | days | months</summary>
    public string? DurationUnit { get; set; }
    public int UsageLimit { get; set; }
    public byte ScopeType { get; set; } = (byte)DiscountScopeType.AllCourses;
    public long? TeacherId { get; set; }
    public long? StudentUserId { get; set; }
    public List<long>? CourseIds { get; set; }
    public string? Title { get; set; }

    public string Path => "/api/Service/Order/DiscountCode/Add";
}
