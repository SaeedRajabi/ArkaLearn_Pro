namespace ArkaSoftwarePro.Src.Infrastructure.Data.MSSQL.Queries.Entities.Baskets;

public class DiscountCodeQueryModel
{
    public long DiscountCodeId { get; set; }
    public string DiscountType { get; set; } = string.Empty;
    public decimal DiscountAmount { get; set; }
    public string Code { get; set; } = string.Empty;
    public DateTime ExpirationDate { get; set; }
    public bool DiscountCodeIsActive { get; set; }
    public byte ScopeType { get; set; }
    public long? TeacherId { get; set; }
    public long? StudentUserId { get; set; }
    public string? Title { get; set; }
    public int UsageLimit { get; set; }
    public int UsedCount { get; set; }
}
