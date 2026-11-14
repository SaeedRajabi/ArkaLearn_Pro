namespace ArkaSoftwarePro.Src.Core.RequestResponse.Courses.Queries.GetCoursesById
{
    public class CourseLessonVideoAccessQri
    {
        public long LessonId { get; set; }
        public long CourseId { get; set; }
        public string LessonTitle { get; set; } = string.Empty;
        public string VideoTitle { get; set; } = string.Empty;
        public string VideoPath { get; set; } = string.Empty;
        public string SectionTitle { get; set; } = string.Empty;
        public bool IsPublished { get; set; }
        public string VideoModerationStatus { get; set; } = "draft";
        public string LifecyclePhase { get; set; } = "notStarted";
    }
}
