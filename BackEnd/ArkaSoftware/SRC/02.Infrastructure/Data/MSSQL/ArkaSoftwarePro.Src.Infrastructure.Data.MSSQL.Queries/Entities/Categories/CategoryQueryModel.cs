using ArkaSoftwarePro.Src.Infrastructure.Data.MSSQL.Queries.Entities.Courses;

namespace ArkaSoftwarePro.Src.Infrastructure.Data.MSSQL.Queries.Entities.Categories
{
    public class CategoryQueryModel
    {
        public long Id { get; set; }
        public string Title { get; set; } = "";
        public string CategoryImage { get; set; } = string.Empty;
        public string? CategoryDescription { get; set; } = string.Empty;
        public DateTime CreateAt { get; set; }
        public long? ParentId { get; set; }
        public Guid BusinessId { get; set; }
        public CategoryQueryModel? Parent { get; set; }
        public ICollection<CategoryQueryModel> Children { get; set; } = new List<CategoryQueryModel>();



        public ICollection<CourseQueryModel> Courses { get; set; } = new List<CourseQueryModel>();
    }
}
