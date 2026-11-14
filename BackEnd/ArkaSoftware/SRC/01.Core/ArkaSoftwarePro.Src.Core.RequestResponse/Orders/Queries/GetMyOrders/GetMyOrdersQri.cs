namespace ArkaSoftwarePro.Src.Core.RequestResponse.Orders.Queries.GetMyOrders
{
    public class GetMyOrdersQri
    {
        public long Id { get; set; }
        public string OrderDate { get; set; } = string.Empty;
        public decimal TotalAmount { get; set; }
        public string Status { get; set; } = string.Empty;
        public List<string> Items { get; set; } = new List<string>();
    }

  
}
