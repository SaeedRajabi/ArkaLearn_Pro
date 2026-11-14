using Framework.Src.Core.RequestResponse.Commands;

namespace ArkaSoftwarePro.Src.Core.RequestResponse.DesktopDrm.Commands.UpsertTeacherStudentSatisfaction;

public class UpsertTeacherStudentSatisfactionCommand : ICommand<TeacherStudentSatisfactionQri>
{
    public long RequestingUserId { get; set; }
    public long EnrollmentId { get; set; }
    public byte Score { get; set; }
    public string? Note { get; set; }
}

public class TeacherStudentSatisfactionQri
{
    public long Id { get; set; }
    public long CourseId { get; set; }
    public long EnrollmentId { get; set; }
    public long TeacherUserId { get; set; }
    public long StudentUserId { get; set; }
    public byte Score { get; set; }
    public string? Note { get; set; }
    public DateTime UpdatedAtUtc { get; set; }
}
