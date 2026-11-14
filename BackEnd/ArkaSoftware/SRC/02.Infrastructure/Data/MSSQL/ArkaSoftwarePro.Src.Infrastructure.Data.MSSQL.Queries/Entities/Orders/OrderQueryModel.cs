using ArkaSoftwarePro.Src.Infrastructure.Data.MSSQL.Queries.Entities.Students;

namespace ArkaSoftwarePro.Src.Infrastructure.Data.MSSQL.Queries.Entities.Orders
{
    public class OrderQueryModel
    {
        public long OrderId { get; set; }
        public DateTime CreateDateTime { get; set; }
        public byte OrderStatus { get; set; }
        public StudentQueryModel Student { get; set; } = new();
        public long StudentId { get; set; }

        public List<OrderItemQueryModel> OrderItems { get; set; } = new List<OrderItemQueryModel>();
    }
}
