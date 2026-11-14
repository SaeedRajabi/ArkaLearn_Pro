using Framework.Src.Core.RequestResponse.Commands;
using Framework.Src.Core.RequestResponse.Endpoints;

namespace ArkaSoftwarePro.Src.Core.RequestResponse.Sms.Commands.SendProfilePhoneVerificationOtp;

public class SendProfilePhoneVerificationOtpCommand : ICommand<object>, IWebRequest
{
    public string Path => "/api/Service/Sms/ProfileVerification/Send";
}
