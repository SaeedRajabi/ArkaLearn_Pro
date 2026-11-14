namespace ArkaSoftwarePro.Src.Infrastructure.Data.MSSQL.Queries.Entities.Courses;

public class CourseInstallmentPlanQueryModel
{
    public long Id { get; set; }
    public long CourseId { get; set; }
    public int InstallmentNumber { get; set; }
    public decimal AmountToman { get; set; }
    public DateTime? DueDateUtc { get; set; }
    public CourseQueryModel? Course { get; set; }
}
