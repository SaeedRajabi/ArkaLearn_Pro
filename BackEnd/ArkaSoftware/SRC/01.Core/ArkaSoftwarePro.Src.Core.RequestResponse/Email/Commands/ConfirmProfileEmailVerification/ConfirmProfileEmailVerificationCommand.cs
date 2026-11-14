using Framework.Src.Core.RequestResponse.Commands;
using Framework.Src.Core.RequestResponse.Endpoints;

namespace ArkaSoftwarePro.Src.Core.RequestResponse.Email.Commands.ConfirmProfileEmailVerification;

public class ConfirmProfileEmailVerificationCommand : ICommand<string>, IWebRequest
{
    public string OtpSessionId { get; set; } = string.Empty;
    public string OtpCode { get; set; } = string.Empty;
    public string Path => "/api/Service/Email/ProfileVerification/Confirm";
}
