using Framework.Src.Core.RequestResponse.Commands;
using Framework.Src.Core.RequestResponse.Endpoints;
using ArkaSoftwarePro.Src.Core.RequestResponse.Courses.Queries.GetMyCourseLessonProgress;

namespace ArkaSoftwarePro.Src.Core.RequestResponse.Courses.Commands.ReportLessonWatchProgress;

public class ReportLessonWatchProgressCommand : ICommand<LessonWatchProgressQri>, IWebRequest
{
    public long LessonId { get; set; }
    public int WatchedSeconds { get; set; }
    public int DurationSeconds { get; set; }
    public string Path => "/api/Service/Course/ReportLessonWatchProgress";
}
