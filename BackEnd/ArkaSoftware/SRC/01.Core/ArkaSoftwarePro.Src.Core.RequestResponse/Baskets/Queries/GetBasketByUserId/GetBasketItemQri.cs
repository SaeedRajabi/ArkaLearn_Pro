namespace ArkaSoftwarePro.Src.Core.RequestResponse.Baskets.Queries.GetBasketByUserId;

public class GetBasketItemQri
{
    public int Quantity { get; set; }
    public decimal Price { get; set; }
    public GetBasketItemCourseByUserIdQri Course { get; set; } = new();
}


public class GetBasketItemCourseByUserIdQri
{
    public int CourseId { get; set; }
}