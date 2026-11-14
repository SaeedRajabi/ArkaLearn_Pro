using Framework.Src.Core.RequestResponse.Commands;

namespace ArkaSoftwarePro.Src.Core.RequestResponse.SupportTickets.Commands.SendContactEmailOtp;

public class SendContactEmailOtpCommand : ICommand<object>
{
    public string FullName { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
}
