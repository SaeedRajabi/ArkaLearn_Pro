using Framework.Src.Core.RequestResponse.Commands;

namespace ArkaSoftwarePro.Src.Core.RequestResponse.Newsletter.Commands.RequestNewsletterSubscribeOtp;

public class RequestNewsletterSubscribeOtpCommand : ICommand<object>
{
    public string Email { get; set; } = string.Empty;
}
