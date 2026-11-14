using Framework.Src.Core.RequestResponse.Commands;
using Framework.Src.Core.RequestResponse.Endpoints;

namespace ArkaSoftwarePro.Src.Core.RequestResponse.Users.Commands.ResendLoginTwoFactorOtp;

public class ResendLoginTwoFactorOtpCommand : ICommand<object>, IWebRequest
{
    public string TwoFactorSessionId { get; set; } = string.Empty;
    public string Path => "/api/Service/Account/LoginTwoFactor/Resend";
}
