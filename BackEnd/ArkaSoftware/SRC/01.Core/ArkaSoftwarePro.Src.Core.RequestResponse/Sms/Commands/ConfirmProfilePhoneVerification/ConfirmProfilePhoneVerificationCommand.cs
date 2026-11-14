using Framework.Src.Core.RequestResponse.Commands;
using Framework.Src.Core.RequestResponse.Endpoints;

namespace ArkaSoftwarePro.Src.Core.RequestResponse.Sms.Commands.ConfirmProfilePhoneVerification;

public class ConfirmProfilePhoneVerificationCommand : ICommand<string>, IWebRequest
{
    public string OtpSessionId { get; set; } = string.Empty;
    public string OtpCode { get; set; } = string.Empty;
    public string Path => "/api/Service/Sms/ProfileVerification/Confirm";
}
