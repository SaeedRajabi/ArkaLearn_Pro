using Framework.Src.Core.RequestResponse.Commands;
using Framework.Src.Core.RequestResponse.Endpoints;

namespace ArkaSoftwarePro.Src.Core.RequestResponse.Sms.Commands.VerifyProjectOrderOtp;

public class VerifyProjectOrderOtpCommand : ICommand<object>, IWebRequest
{
    public string SessionId { get; set; } = string.Empty;
    public string PhoneNumber { get; set; } = string.Empty;
    public string OtpCode { get; set; } = string.Empty;
    public string Path => "/api/Service/Sms/ProjectOrder/Verify";
}
