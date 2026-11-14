using Framework.Src.Core.RequestResponse.Commands;
using Framework.Src.Core.RequestResponse.Endpoints;

namespace ArkaSoftwarePro.Src.Core.RequestResponse.Sms.Commands.ConfirmPhoneChange;

public class ConfirmPhoneChangeCommand : ICommand<string>, IWebRequest
{
    public string NewPhoneNumber { get; set; } = string.Empty;
    public string OtpSessionId { get; set; } = string.Empty;
    public string OtpCode { get; set; } = string.Empty;
    public string Path => "/api/Service/Sms/PhoneChange/Confirm";
}
