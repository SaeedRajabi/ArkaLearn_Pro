using Framework.Src.Core.RequestResponse.Commands;
using Framework.Src.Core.RequestResponse.Endpoints;

namespace ArkaSoftwarePro.Src.Core.RequestResponse.Courses.Commands.AdminMarkCourseInstallmentPaid;

public class AdminMarkCourseInstallmentPaidCommand : ICommand<string>, IWebRequest
{
    public long InstallmentId { get; set; }
    public string? PaymentReference { get; set; }
    public string? AdminNote { get; set; }

    public string Path => "/api/Service/CourseInstallments/MarkCoursePaid";
}
