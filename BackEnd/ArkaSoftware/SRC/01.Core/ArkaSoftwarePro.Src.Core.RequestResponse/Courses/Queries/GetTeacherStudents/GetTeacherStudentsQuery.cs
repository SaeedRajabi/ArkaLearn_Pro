using Framework.Src.Core.RequestResponse.Endpoints;
using Framework.Src.Core.RequestResponse.Queries;

namespace ArkaSoftwarePro.Src.Core.RequestResponse.Courses.Queries.GetTeacherStudents;

public class GetTeacherStudentsQuery : PageQuery<PagedData<TeacherStudentQri>>, IWebRequest
{
    public long TeacherUserId { get; set; }
    public string InputValue { get; set; } = string.Empty;
    public string Path => "/api/Service/Course/GetMyStudents";
}

public class TeacherStudentQri
{
    public long StudentId { get; set; }
    public long UserId { get; set; }
    public string FullName { get; set; } = string.Empty;
    public string? UserName { get; set; }
    public string? Email { get; set; }
    public string? PhoneNumber { get; set; }
    /// <summary>course | seminar</summary>
    public string SourceType { get; set; } = string.Empty;
    public long SourceId { get; set; }
    public string SourceTitle { get; set; } = string.Empty;
    public string RegisteredAt { get; set; } = string.Empty;
    public bool IsActive { get; set; }
    public long? ManagedRoomStudentId { get; set; }
}
