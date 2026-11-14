namespace ArkaSoftwarePro.Src.Core.RequestResponse.Baskets.Queries.GetBasketCourseById;

public class GetBasketCoursesQri
{
    public string CourseName { get; set; } = string.Empty;
    public string CourseCategory { get; set; } = string.Empty;
    public int Quantity { get; set; }
    public decimal CourseUnitPrice { get; set; }
}