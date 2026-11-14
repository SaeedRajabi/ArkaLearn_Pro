using Framework.Src.Core.RequestResponse.Commands;
using Framework.Src.Core.RequestResponse.Endpoints;

namespace ArkaSoftwarePro.Src.Core.RequestResponse.Email.Commands.SendEmailChangeOtp;

public class SendEmailChangeOtpCommand : ICommand<object>, IWebRequest
{
    public string NewEmail { get; set; } = string.Empty;
    public string Path => "/api/Service/Email/EmailChange/Send";
}
