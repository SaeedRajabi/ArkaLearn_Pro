using Framework.Src.Core.RequestResponse.Endpoints;
using Framework.Src.Core.RequestResponse.Queries;

namespace ArkaSoftwarePro.Src.Core.RequestResponse.Exams.Queries.GetCourseStudentsForExam;

public class GetCourseStudentsForExamQuery : IQuery<List<CourseStudentForExamQri>>, IWebRequest
{
    public long CourseId { get; set; }
    public long TeacherUserId { get; set; }
    public string Path => "/api/Service/Exam/GetCourseStudents";
}

public class CourseStudentForExamQri
{
    public long StudentId { get; set; }
    public long UserId { get; set; }
    public string FullName { get; set; } = string.Empty;
    public string? UserName { get; set; }
    public string? Email { get; set; }
}
