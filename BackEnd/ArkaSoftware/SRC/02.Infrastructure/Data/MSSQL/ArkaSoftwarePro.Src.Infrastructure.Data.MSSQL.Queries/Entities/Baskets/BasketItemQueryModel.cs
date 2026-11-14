using ArkaSoftwarePro.Src.Infrastructure.Data.MSSQL.Queries.Entities.Courses;

namespace ArkaSoftwarePro.Src.Infrastructure.Data.MSSQL.Queries.Entities.Baskets;

public class BasketItemQueryModel
{
    public long BasketItemId { get; set; }
    public CourseQueryModel? Course { get; set; }
    public long CourseId { get; set; }
    public int Quantity { get; set; }
    public long BasketId { get; set; }
    public BasketQueryModel Basket { get; set; } = new();
}