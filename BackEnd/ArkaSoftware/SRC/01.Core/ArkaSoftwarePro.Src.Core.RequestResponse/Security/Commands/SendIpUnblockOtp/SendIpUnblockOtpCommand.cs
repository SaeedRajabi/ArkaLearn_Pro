using Framework.Src.Core.RequestResponse.Commands;
using Framework.Src.Core.RequestResponse.Endpoints;

namespace ArkaSoftwarePro.Src.Core.RequestResponse.Security.Commands.SendIpUnblockOtp;

public class SendIpUnblockOtpCommand : ICommand<IpUnblockOtpSessionQri>, IWebRequest
{
    public string PhoneNumber { get; set; } = string.Empty;
    public string Path => "/api/Service/Security/IpUnblockOtp/Send";
}

public class IpUnblockOtpSessionQri
{
    public string SessionId { get; set; } = string.Empty;
    public int ResendCooldownSeconds { get; set; }
    public int ExpiresInSeconds { get; set; }
}
