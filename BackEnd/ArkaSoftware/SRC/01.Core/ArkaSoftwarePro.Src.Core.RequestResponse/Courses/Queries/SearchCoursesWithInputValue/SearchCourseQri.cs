namespace ArkaSoftwarePro.Src.Core.RequestResponse.Courses.Queries.SearchCoursesWithInputValue
{
    public class SearchCourseQri
    {
        public long Id { get; set; }
        public string Slug { get; set; } = string.Empty;
        public string Title { get; set; } = string.Empty;
        public decimal? Price { get; set; }
        public decimal? OriginalPrice { get; set; }
        public string? CreateAt { get; set; }
        public string? CoursePlan { get; set; }
        public string? CourseLevel { get; set; } = "";
        public string? ShortDescription { get; set; } = "";
        public string? TitleImage { get; set; } = "";
        public string CategoryName { get; set; } = string.Empty;
        public long? CategoryId { get; set; }
        public List<string> CategoryPath { get; set; } = new();
        public string Status { get; set; } = string.Empty;
        public bool IsPublish { get; set; }
        public string? ModerationStatus { get; set; }
        public string? ModerationRejectionNote { get; set; }
        public string VideoUrl { get; set; } = string.Empty;
        public int StudentCount { get; set; }
        public int CommentCount { get; set; }
        public int LikeCount { get; set; }
        public decimal Rating { get; set; }
        public string TeacherName { get; set; } = string.Empty;
        /// <summary>Total video duration in whole minutes.</summary>
        public int DurationMinutes { get; set; }
        /// <summary>directDownload | desktopLicense</summary>
        public string DeliveryMode { get; set; } = "directDownload";
    }
}
