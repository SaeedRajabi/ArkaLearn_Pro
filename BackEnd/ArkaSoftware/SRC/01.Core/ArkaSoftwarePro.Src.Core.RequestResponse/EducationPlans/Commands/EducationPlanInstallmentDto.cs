namespace ArkaSoftwarePro.Src.Core.RequestResponse.EducationPlans.Commands;

public class EducationPlanInstallmentDto
{
    public int InstallmentNumber { get; set; }
    public DateTime DueDateUtc { get; set; }
    public decimal AmountToman { get; set; }
}
