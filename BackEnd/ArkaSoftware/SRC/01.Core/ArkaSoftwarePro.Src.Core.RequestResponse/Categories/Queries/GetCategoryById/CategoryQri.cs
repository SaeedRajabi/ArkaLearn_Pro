namespace ArkaSoftwarePro.Src.Core.RequestResponse.Categories.Queries.GetCategoryById
{
    public class CategoryQri
    {
        public long Id { get; set; }
        public string CategoryName { get; set; } = string.Empty;
        public string CategoryDescription { get; set; } = string.Empty;
        public string ImageUrl { get; set; } = string.Empty;
        public long? ParentId { get; set; }
        public string? ParentName { get; set; }
        public int CourseCount { get; set; }
        public List<CategoryChildQri> Children { get; set; } = new();
    }
}
