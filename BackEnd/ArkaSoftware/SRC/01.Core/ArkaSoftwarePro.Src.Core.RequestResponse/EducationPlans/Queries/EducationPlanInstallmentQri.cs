namespace ArkaSoftwarePro.Src.Core.RequestResponse.EducationPlans.Queries;

public class EducationPlanInstallmentQri
{
    public long InstallmentId { get; set; }
    public long EducationPlanId { get; set; }
    public int InstallmentNumber { get; set; }
    public DateTime DueDateUtc { get; set; }
    public decimal AmountToman { get; set; }
    public bool IsPaid { get; set; }
    public DateTime? PaidAtUtc { get; set; }
    public bool IsOverdue { get; set; }
}
