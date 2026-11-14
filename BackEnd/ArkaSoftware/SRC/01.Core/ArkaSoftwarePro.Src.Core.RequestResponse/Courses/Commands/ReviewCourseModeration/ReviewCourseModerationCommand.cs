using Framework.Src.Core.RequestResponse.Commands;
using Framework.Src.Core.RequestResponse.Endpoints;

namespace ArkaSoftwarePro.Src.Core.RequestResponse.Courses.Commands.ReviewCourseModeration;

public class ReviewCourseModerationCommand : ICommand<string>, IWebRequest
{
    public string ItemType { get; set; } = string.Empty;
    public long CourseId { get; set; }
    public long? LessonId { get; set; }
    public bool Approve { get; set; }
    public string? RejectionNote { get; set; }
    public string Path => "/api/Service/Course/ReviewModeration";
}
