namespace ArkaSoftwarePro.Src.Core.RequestResponse.Categories.Queries.GetCategoryById;

public class CategoryChildQri
{
    public long Id { get; set; }
    public string CategoryName { get; set; } = string.Empty;
    public string ImageUrl { get; set; } = string.Empty;
    public int CourseCount { get; set; }
}
