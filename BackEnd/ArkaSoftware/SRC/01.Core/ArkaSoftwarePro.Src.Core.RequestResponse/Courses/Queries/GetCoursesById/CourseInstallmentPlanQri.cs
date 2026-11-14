namespace ArkaSoftwarePro.Src.Core.RequestResponse.Courses.Queries.GetCoursesById;

public class CourseInstallmentPlanQri
{
    public int InstallmentNumber { get; set; }
    public decimal AmountToman { get; set; }
    public DateTime? DueDateUtc { get; set; }
}
