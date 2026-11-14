using Framework.Src.Core.RequestResponse.Commands;
using Framework.Src.Core.RequestResponse.Endpoints;

namespace ArkaSoftwarePro.Src.Core.RequestResponse.Sms.Commands.SendRegistrationOtp;

public class SendRegistrationOtpCommand : ICommand<object>, IWebRequest
{
    public string UserName { get; set; } = string.Empty;
    public string FullName { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string PhoneNumber { get; set; } = string.Empty;
    public string Path => "/api/Service/Sms/Registration/Send";
}
