namespace ArkaSoftwarePro.Src.Core.RequestResponse.Courses.Queries.GetAllPopularCourse
{
    public class GetAllPopularCourseQri
    {
        public long CourseId { get; set; }
        public string Slug { get; set; } = string.Empty;
        public string Title { get; set; } = string.Empty;
        public decimal? CoursePrice { get; set; }
        public decimal? OriginalPrice { get; set; }
        public string? CreateAt { get; set; }
        public string? CoursePlan { get; set; }
        public string? CourseLevel { get; set; } = "";
        public string? ShortDescription { get; set; } = "";
        public string? LogoImage { get; set; } = "";
        public string CategoryName { get; set; } = string.Empty;
        public long? CategoryId { get; set; }
        public List<string> CategoryPath { get; set; } = new();
    }
}
