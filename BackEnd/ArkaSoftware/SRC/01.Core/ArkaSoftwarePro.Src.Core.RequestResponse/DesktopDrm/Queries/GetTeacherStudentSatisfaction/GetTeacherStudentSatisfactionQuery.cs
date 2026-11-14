using Framework.Src.Core.RequestResponse.Queries;

namespace ArkaSoftwarePro.Src.Core.RequestResponse.DesktopDrm.Queries.GetTeacherStudentSatisfaction;

public class GetTeacherStudentSatisfactionQuery : IQuery<List<TeacherStudentSatisfactionItemQri>>
{
    public long RequestingUserId { get; set; }
    public long CourseId { get; set; }
    public long EnrollmentId { get; set; }
}

public class TeacherStudentSatisfactionItemQri
{
    public long Id { get; set; }
    public long CourseId { get; set; }
    public long EnrollmentId { get; set; }
    public long TeacherUserId { get; set; }
    public long StudentUserId { get; set; }
    public string? StudentName { get; set; }
    public byte Score { get; set; }
    public string? Note { get; set; }
    public DateTime UpdatedAtUtc { get; set; }
}
