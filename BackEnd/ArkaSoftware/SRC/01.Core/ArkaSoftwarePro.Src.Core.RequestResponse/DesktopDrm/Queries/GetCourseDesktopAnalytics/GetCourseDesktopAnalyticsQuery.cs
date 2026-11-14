using Framework.Src.Core.RequestResponse.Queries;

namespace ArkaSoftwarePro.Src.Core.RequestResponse.DesktopDrm.Queries.GetCourseDesktopAnalytics;

public class GetCourseDesktopAnalyticsQuery : IQuery<CourseDesktopAnalyticsQri>
{
    public long RequestingUserId { get; set; }
    public long CourseId { get; set; }
}

public class CourseDesktopAnalyticsQri
{
    public long CourseId { get; set; }
    public List<CourseDesktopLessonAnalyticsQri> Lessons { get; set; } = [];
    public List<CourseDesktopStudentAnalyticsQri> Students { get; set; } = [];
}

public class CourseDesktopLessonAnalyticsQri
{
    public long LessonId { get; set; }
    public string LessonTitle { get; set; } = string.Empty;
    public int TotalWatchedSeconds { get; set; }
    public int UniqueViewerCount { get; set; }
    public int EventCount { get; set; }
}

public class CourseDesktopStudentAnalyticsQri
{
    public long UserId { get; set; }
    public long? EnrollmentId { get; set; }
    public string? StudentName { get; set; }
    public int TotalWatchedSeconds { get; set; }
    public int LessonsTouched { get; set; }
    public DateTime? LastActivityUtc { get; set; }
}
