namespace ArkaSoftwarePro.Src.Core.RequestResponse.Courses.Queries.GetCoursesById
{
    public class CourseLessonQri
    {
        public long LessonId { get; set; }
        public string LessonTitle { get; set; } = string.Empty;
        public string VideoTitle { get; set; } = string.Empty;
        public string VideoUrl { get; set; } = string.Empty;
        public int DurationSeconds { get; set; }
        public string DurationLabel { get; set; } = string.Empty;
        public bool HasVideo { get; set; }
        public bool IsPublished { get; set; }
        public bool IsLocked { get; set; }
        public long? MediaAssetId { get; set; }
        public bool HasEncryptedVideo { get; set; }
    }
}
