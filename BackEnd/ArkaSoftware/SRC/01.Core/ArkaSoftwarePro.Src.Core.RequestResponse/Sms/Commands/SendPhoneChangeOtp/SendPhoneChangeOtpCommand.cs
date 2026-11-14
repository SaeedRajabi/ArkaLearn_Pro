using Framework.Src.Core.RequestResponse.Commands;
using Framework.Src.Core.RequestResponse.Endpoints;

namespace ArkaSoftwarePro.Src.Core.RequestResponse.Sms.Commands.SendPhoneChangeOtp;

public class SendPhoneChangeOtpCommand : ICommand<object>, IWebRequest
{
    public string NewPhoneNumber { get; set; } = string.Empty;
    public string Path => "/api/Service/Sms/PhoneChange/Send";
}
