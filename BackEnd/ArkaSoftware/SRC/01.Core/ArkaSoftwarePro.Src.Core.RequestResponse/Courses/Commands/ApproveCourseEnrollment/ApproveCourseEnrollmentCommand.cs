using Framework.Src.Core.RequestResponse.Commands;
using Framework.Src.Core.RequestResponse.Endpoints;

namespace ArkaSoftwarePro.Src.Core.RequestResponse.Courses.Commands.ApproveCourseEnrollment;

public class ApproveCourseEnrollmentCommand : ICommand<ApproveCourseEnrollmentResult>, IWebRequest
{
    public long EnrollmentId { get; set; }
    public string Path => "/api/Service/Course/ApproveEnrollment";
}

public class ApproveCourseEnrollmentResult
{
    public long EnrollmentId { get; set; }
    public string SpotPlayerLicense { get; set; } = string.Empty;
    public string CourseTitle { get; set; } = string.Empty;
}
