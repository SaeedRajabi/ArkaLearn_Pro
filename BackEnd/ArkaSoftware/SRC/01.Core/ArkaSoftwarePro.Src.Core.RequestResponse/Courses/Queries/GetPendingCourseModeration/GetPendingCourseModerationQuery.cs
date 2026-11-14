using Framework.Src.Core.RequestResponse.Endpoints;
using Framework.Src.Core.RequestResponse.Queries;

namespace ArkaSoftwarePro.Src.Core.RequestResponse.Courses.Queries.GetPendingCourseModeration;

public class GetPendingCourseModerationQuery : IQuery<List<PendingCourseModerationQri>>, IWebRequest
{
    public string Path => "api/Service/Course/GetPendingModeration";
}

public class PendingCourseModerationQri
{
    public string ItemType { get; set; } = string.Empty;
    public long CourseId { get; set; }
    public long? LessonId { get; set; }
    public long TeacherId { get; set; }
    public long? TeacherUserId { get; set; }
    public string TeacherDisplayName { get; set; } = string.Empty;
    public string TeacherUserName { get; set; } = string.Empty;
    public string Title { get; set; } = string.Empty;
    public string? CourseTitle { get; set; }
    public string? PreviewUrl { get; set; }
    public string? ThumbnailUrl { get; set; }
    public DateTime? SubmittedAtUtc { get; set; }
}
