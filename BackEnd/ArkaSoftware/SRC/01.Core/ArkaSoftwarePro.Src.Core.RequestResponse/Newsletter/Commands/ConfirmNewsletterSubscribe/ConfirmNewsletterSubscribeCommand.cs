using Framework.Src.Core.RequestResponse.Commands;

namespace ArkaSoftwarePro.Src.Core.RequestResponse.Newsletter.Commands.ConfirmNewsletterSubscribe;

public class ConfirmNewsletterSubscribeCommand : ICommand<string>
{
    public string Email { get; set; } = string.Empty;
    public string OtpSessionId { get; set; } = string.Empty;
    public string OtpCode { get; set; } = string.Empty;
}
