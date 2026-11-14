using Framework.Src.Core.RequestResponse.Endpoints;
using Framework.Src.Core.RequestResponse.Queries;

namespace ArkaSoftwarePro.Src.Core.RequestResponse.SupportChat.Queries.GetStudentSupportTeachers;

public class GetStudentSupportTeachersQuery : IQuery<List<StudentSupportTeacherQri>>, IWebRequest
{
    public long UserId { get; set; }
    public string Path => "/api/Service/SupportChat/GetStudentTeachers";
}

public class StudentSupportTeacherQri
{
    public long TeacherUserId { get; set; }
    public string DisplayName { get; set; } = string.Empty;
    public string? Email { get; set; }
    public string Source { get; set; } = string.Empty;
}
