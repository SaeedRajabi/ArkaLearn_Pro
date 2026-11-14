using Framework.Src.Core.RequestResponse.Endpoints;
using Framework.Src.Core.RequestResponse.Queries;

namespace ArkaSoftwarePro.Src.Core.RequestResponse.Courses.Queries.GetTeacherEnrolledStudents;

public class GetTeacherEnrolledStudentsQuery : IQuery<List<TeacherEnrolledStudentQri>>, IWebRequest
{
    public long TeacherUserId { get; set; }
    public string Path => "/api/Service/Course/GetMyEnrolledStudents";
}

public class TeacherEnrolledStudentQri
{
    public long StudentId { get; set; }
    public long UserId { get; set; }
    public string FullName { get; set; } = string.Empty;
    public string? UserName { get; set; }
    public string? Email { get; set; }
    public long CourseId { get; set; }
    public string CourseTitle { get; set; } = string.Empty;
    public string EnrollmentDateTime { get; set; } = string.Empty;
    public bool IsActive { get; set; }
}
