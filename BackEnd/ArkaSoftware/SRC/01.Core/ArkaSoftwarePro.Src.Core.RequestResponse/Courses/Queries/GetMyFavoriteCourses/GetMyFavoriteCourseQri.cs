namespace ArkaSoftwarePro.Src.Core.RequestResponse.Courses.Queries.GetMyFavoriteCourses
{
    public class GetMyFavoriteCourseQri
    {
        public long Id { get; set; }
        public string Title { get; set; } = string.Empty;
        public decimal? Price { get; set; }
        public string? CreateAt { get; set; }
        public string? CourseLevel { get; set; }
        public string? ShortDescription { get; set; }
        public string? TitleImage { get; set; }
        public string CategoryName { get; set; } = string.Empty;
        public string Status { get; set; } = string.Empty;
        public string? VideoUrl { get; set; }
        public int StudentCount { get; set; }
    }
}
