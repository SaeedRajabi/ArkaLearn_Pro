using Framework.Src.Core.RequestResponse.Commands;
using Framework.Src.Core.RequestResponse.Endpoints;

namespace ArkaSoftwarePro.Src.Core.RequestResponse.EducationPlans.Commands.AdminMarkEducationPlanInstallmentPaid;

public class AdminMarkEducationPlanInstallmentPaidCommand : ICommand<string>, IWebRequest
{
    public long InstallmentId { get; set; }
    public string? PaymentReference { get; set; }
    public string? AdminNote { get; set; }

    public string Path => "/api/Service/CourseInstallments/MarkEducationPlanPaid";
}
