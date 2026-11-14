namespace ArkaSoftwarePro.Src.Core.RequestResponse.Orders.Queries.GetOrderById
{
    public class GetOrderByIdQri
    {
        public long Id { get; set; }
        public long StudentId { get; set; }
        public string Status { get; set; } = string.Empty;
        public string OrderDate { get; set; } = string.Empty;
        public List<OrderItemQri> OrderItems { get; set; } = new List<OrderItemQri>();
    }

    public class OrderItemQri
    {
        public long CourseId { get; set; }
        public string CourseTitle { get; set; } = string.Empty;
        public decimal UnitPrice { get; set; }
        public int Quantity { get; set; }
        public decimal TotalPrice { get; set; }
    }
}
