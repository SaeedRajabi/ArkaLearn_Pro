using Framework.Src.Core.RequestResponse.Commands;
using Framework.Src.Core.RequestResponse.Endpoints;

namespace ArkaSoftwarePro.Src.Core.RequestResponse.Users.Commands.ConfirmLoginTwoFactor;

public class ConfirmLoginTwoFactorCommand : ICommand<object>, IWebRequest
{
    public string TwoFactorSessionId { get; set; } = string.Empty;
    public string OtpCode { get; set; } = string.Empty;
    public string Path => "/api/Service/Account/LoginTwoFactor/Confirm";
}
