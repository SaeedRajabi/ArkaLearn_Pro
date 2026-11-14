using Framework.Src.Core.RequestResponse.Commands;
using Framework.Src.Core.RequestResponse.Endpoints;

namespace ArkaSoftwarePro.Src.Core.RequestResponse.Security.Commands.SubmitIpUnblockRequest;

public class SubmitIpUnblockRequestCommand : ICommand<string>, IWebRequest
{
    public string PhoneNumber { get; set; } = string.Empty;
    public string OtpSessionId { get; set; } = string.Empty;
    public string OtpCode { get; set; } = string.Empty;
    public string Message { get; set; } = string.Empty;
    public string Path => "/api/Service/Security/IpUnblock/Submit";
}
