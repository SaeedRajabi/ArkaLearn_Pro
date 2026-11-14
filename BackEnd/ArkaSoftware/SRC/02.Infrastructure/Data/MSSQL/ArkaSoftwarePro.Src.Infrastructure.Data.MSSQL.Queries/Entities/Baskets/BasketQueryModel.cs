namespace ArkaSoftwarePro.Src.Infrastructure.Data.MSSQL.Queries.Entities.Baskets
{
    public class BasketQueryModel
    {
        public long BasketId { get; set; }
        public DiscountCodeQueryModel DiscountCode { get; set; } = new();
        public long DiscountCodeId { get; set; }
        public List<BasketItemQueryModel> BasketItems { get; set; } = new List<BasketItemQueryModel>();
        
    }
}
