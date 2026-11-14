namespace ArkaSoftwarePro.Src.Infrastructure.Data.MSSQL.Queries.Entities.Desktop;

public class TeacherStudentSatisfactionQueryModel
{
    public long Id { get; set; }
    public long CourseId { get; set; }
    public long EnrollmentId { get; set; }
    public long TeacherUserId { get; set; }
    public long StudentUserId { get; set; }
    public byte Score { get; set; }
    public string? Note { get; set; }
    public DateTime UpdatedAtUtc { get; set; }
    public bool IsDelete { get; set; }
}
