using Framework.Src.Core.RequestResponse.Endpoints;
using Framework.Src.Core.RequestResponse.Queries;

namespace ArkaSoftwarePro.Src.Core.RequestResponse.Courses.Queries.GetMyCourseLessonProgress;

public class GetMyCourseLessonProgressQuery : IQuery<List<LessonWatchProgressQri>>, IWebRequest
{
    public long CourseId { get; set; }
    public long UserId { get; set; }
    public string Path => "/api/Service/Course/GetMyCourseLessonProgress";
}

public class LessonWatchProgressQri
{
    public long LessonId { get; set; }
    public int WatchedSeconds { get; set; }
    public int DurationSeconds { get; set; }
    public int WatchedPercent { get; set; }
    public bool IsCompleted { get; set; }
}
