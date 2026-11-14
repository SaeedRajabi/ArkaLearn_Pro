using Framework.Src.Core.RequestResponse.Commands;

namespace ArkaSoftwarePro.Src.Core.RequestResponse.Newsletter.Commands.UnsubscribeNewsletter;

public class UnsubscribeNewsletterCommand : ICommand<string>
{
    public string Email { get; set; } = string.Empty;
}
