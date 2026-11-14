using Framework.Src.Core.RequestResponse.Commands;
using Framework.Src.Core.RequestResponse.Endpoints;

namespace ArkaSoftwarePro.Src.Core.RequestResponse.Users.Commands.AdminAssignStudentsToTeacher;

public class AdminAssignStudentsToTeacherCommand : ICommand<AdminAssignStudentsToTeacherResult>, IWebRequest
{
    public long TeacherUserId { get; set; }
    public List<long> StudentUserIds { get; set; } = [];
    public long CourseId { get; set; }
    public string Path => "/api/Service/AdminUserManagement/AssignStudentsToTeacher";
}

public class AdminAssignStudentsToTeacherResult
{
    public int EnrolledCount { get; set; }
    public int SkippedCount { get; set; }
}
