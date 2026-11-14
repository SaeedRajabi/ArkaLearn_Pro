using ArkaSoftwarePro.Src.Infrastructure.Data.MSSQL.Queries.Entities.Courses;

namespace ArkaSoftwarePro.Src.Infrastructure.Data.MSSQL.Queries.Entities.Orders;

public class OrderItemQueryModel
{
    public long OrderItemId { get; set; }
    public long OrderId { get; set; }
    public int Quantity { get; set; }
    public decimal UnitPrice { get; set; }

    public CourseQueryModel Course { get; set; } = new();
    public long CourseId { get; set; }
}