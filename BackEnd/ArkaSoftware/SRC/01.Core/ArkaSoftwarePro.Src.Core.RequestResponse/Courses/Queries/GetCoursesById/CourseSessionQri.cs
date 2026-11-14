namespace ArkaSoftwarePro.Src.Core.RequestResponse.Courses.Queries.GetCoursesById
{
    public class CourseSessionQri
    {
        public long SessionId { get; set; }
        public string SessionTitle { get; set; } = string.Empty;

        public List<CourseLessonQri> CourseLessons { get; set; } = new List<CourseLessonQri>();

    }
}
