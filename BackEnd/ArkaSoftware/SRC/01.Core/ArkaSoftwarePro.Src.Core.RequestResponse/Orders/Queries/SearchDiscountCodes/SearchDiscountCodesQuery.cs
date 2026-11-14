using Framework.Src.Core.RequestResponse.Endpoints;
using Framework.Src.Core.RequestResponse.Queries;

namespace ArkaSoftwarePro.Src.Core.RequestResponse.Orders.Queries.SearchDiscountCodes;

public class SearchDiscountCodesQuery : PageQuery<PagedData<DiscountCodeListItemQri>>, IWebRequest
{
    public string? InputValue { get; set; }
    public byte? ScopeType { get; set; }
    public bool? IsActive { get; set; }
    public long? TeacherId { get; set; }
    public long? StudentUserId { get; set; }
    public long? CourseId { get; set; }
    public string Path => "/api/Service/Order/DiscountCode/Search";
}

public class DiscountCodeListItemQri
{
    public long Id { get; set; }
    public string Code { get; set; } = string.Empty;
    public string? Title { get; set; }
    public decimal Amount { get; set; }
    public string DiscountType { get; set; } = string.Empty;
    public DateTime ExpirationDate { get; set; }
    public bool IsActive { get; set; }
    public bool IsExpired { get; set; }
    public int UsageLimit { get; set; }
    public int UsedCount { get; set; }
    public byte ScopeType { get; set; }
    public string ScopeLabel { get; set; } = string.Empty;
    public long? TeacherId { get; set; }
    public long? StudentUserId { get; set; }
    public List<long> CourseIds { get; set; } = new();
}
