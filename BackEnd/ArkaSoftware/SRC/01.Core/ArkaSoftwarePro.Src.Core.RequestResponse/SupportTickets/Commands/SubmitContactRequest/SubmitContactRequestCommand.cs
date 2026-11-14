using Framework.Src.Core.RequestResponse.Commands;

namespace ArkaSoftwarePro.Src.Core.RequestResponse.SupportTickets.Commands.SubmitContactRequest;

public class SubmitContactRequestCommand : ICommand<string>
{
    public string FullName { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string Message { get; set; } = string.Empty;
    public string EmailOtpSessionId { get; set; } = string.Empty;
    public string EmailOtpCode { get; set; } = string.Empty;
}
