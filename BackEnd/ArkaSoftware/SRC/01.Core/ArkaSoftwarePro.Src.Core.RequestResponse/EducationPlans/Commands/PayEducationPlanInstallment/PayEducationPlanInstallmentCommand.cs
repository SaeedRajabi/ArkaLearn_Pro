using Framework.Src.Core.RequestResponse.Commands;

namespace ArkaSoftwarePro.Src.Core.RequestResponse.EducationPlans.Commands.PayEducationPlanInstallment;

public class PayEducationPlanInstallmentCommand : ICommand<string>
{
    public long InstallmentId { get; set; }
    public long UserId { get; set; }
    public string? PaymentReference { get; set; }
}
