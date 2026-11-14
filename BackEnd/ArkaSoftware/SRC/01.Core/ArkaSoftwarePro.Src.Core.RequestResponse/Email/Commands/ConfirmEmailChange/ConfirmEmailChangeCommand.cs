using Framework.Src.Core.RequestResponse.Commands;
using Framework.Src.Core.RequestResponse.Endpoints;

namespace ArkaSoftwarePro.Src.Core.RequestResponse.Email.Commands.ConfirmEmailChange;

public class ConfirmEmailChangeCommand : ICommand<string>, IWebRequest
{
    public string NewEmail { get; set; } = string.Empty;
    public string OtpSessionId { get; set; } = string.Empty;
    public string OtpCode { get; set; } = string.Empty;
    public string Path => "/api/Service/Email/EmailChange/Confirm";
}
