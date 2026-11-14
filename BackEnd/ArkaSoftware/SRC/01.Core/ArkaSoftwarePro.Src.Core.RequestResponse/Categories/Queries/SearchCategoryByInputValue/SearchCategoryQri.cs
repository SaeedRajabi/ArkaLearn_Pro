namespace ArkaSoftwarePro.Src.Core.RequestResponse.Categories.Queries.SearchCategoryByInputValue
{
    public class SearchCategoryQri
    {
        public long CategoryId { get; set; }
        public SearchCategoryQri? Parent { get; set; }
        public string Name { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public string ImageUrl { get; set; } = string.Empty;
        public int CourseCount { get; set; }
        public string CreateAt { get; set; } = string.Empty;
        public Guid BusinessId { get; set; }
        public List<SearchCategoryQri> Children { get; set; } = new List<SearchCategoryQri>();
    }
}
