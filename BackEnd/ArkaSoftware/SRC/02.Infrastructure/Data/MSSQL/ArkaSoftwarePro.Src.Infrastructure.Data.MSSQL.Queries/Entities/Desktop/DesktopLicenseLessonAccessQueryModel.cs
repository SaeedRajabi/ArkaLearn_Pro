namespace ArkaSoftwarePro.Src.Infrastructure.Data.MSSQL.Queries.Entities.Desktop;

public class DesktopLicenseLessonAccessQueryModel
{
    public long Id { get; set; }
    public long EnrollmentId { get; set; }
    public long LessonId { get; set; }
    public bool IsDelete { get; set; }
}
