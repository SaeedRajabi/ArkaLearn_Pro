using Framework.Src.Core.RequestResponse.Commands;
using Framework.Src.Core.RequestResponse.Endpoints;

namespace ArkaSoftwarePro.Src.Core.RequestResponse.ProjectOrders.Commands.SubmitProjectOrder;

public class SubmitProjectOrderCommand : ICommand<string>, IWebRequest
{
    public string FirstName { get; set; } = string.Empty;
    public string LastName { get; set; } = string.Empty;
    public string Phone { get; set; } = string.Empty;
    public string Title { get; set; } = string.Empty;
    public string ProjectType { get; set; } = string.Empty;
    public string? OtpSessionId { get; set; }
    public string? OtpCode { get; set; }

    public string Path => "/api/Service/ProjectOrder/Submit";
}
