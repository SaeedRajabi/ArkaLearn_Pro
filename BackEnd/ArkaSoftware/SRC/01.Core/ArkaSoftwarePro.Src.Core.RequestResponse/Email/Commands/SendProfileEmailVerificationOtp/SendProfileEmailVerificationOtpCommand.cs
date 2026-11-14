using Framework.Src.Core.RequestResponse.Commands;
using Framework.Src.Core.RequestResponse.Endpoints;

namespace ArkaSoftwarePro.Src.Core.RequestResponse.Email.Commands.SendProfileEmailVerificationOtp;

public class SendProfileEmailVerificationOtpCommand : ICommand<object>, IWebRequest
{
    public string Path => "/api/Service/Email/ProfileVerification/Send";
}
