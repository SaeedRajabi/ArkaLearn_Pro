using Framework.Src.Core.RequestResponse.Commands;
using Framework.Src.Core.RequestResponse.Endpoints;

namespace ArkaSoftwarePro.Src.Core.RequestResponse.Courses.Commands.PayCourseInstallment;

public class PayCourseInstallmentCommand : ICommand<string>, IWebRequest
{
    public long InstallmentId { get; set; }
    public long UserId { get; set; }
    public string? PaymentReference { get; set; }

    public string Path => "/api/Service/Course/PayInstallment";
}
