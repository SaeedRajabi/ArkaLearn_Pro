using ArkaSoftwarePro.Src.Core.Contracts.Email;
using ArkaSoftwarePro.Src.Core.RequestResponse.SupportTickets.Commands.SendContactEmailOtp;
using Framework.Src.Core.ApplicationService.Commands;
using Framework.Src.Core.RequestResponse.Commands;
using Framework.Src.Core.RequestResponse.Common;
using Framework.Src.Utilities.OutService.Services;

namespace ArkaSoftwarePro.Src.Core.ApplicationService.SupportTicketServices.Commands;

public class SendContactEmailOtpCommandHandler(
    ArkaSoftwareCMPOutServices outer,
    IEmailVerificationService emailVerificationService)
    : CommandHandler<SendContactEmailOtpCommand, object>(outer)
{
    public override async Task<CommandResult<object>> Handle(SendContactEmailOtpCommand command)
    {
        var fullName = (command.FullName ?? string.Empty).Trim();
        var email = (command.Email ?? string.Empty).Trim();

        if (fullName.Length < 2)
        {
            AddMessage("Full name is required.");
            return await ResultAsync(new { message = "Full name is required." }, ApplicationServiceStatus.ValidationError);
        }

        if (string.IsNullOrWhiteSpace(email))
        {
            AddMessage("Email is required.");
            return await ResultAsync(new { message = "Email is required." }, ApplicationServiceStatus.ValidationError);
        }

        try
        {
            var session = await emailVerificationService.SendContactFormOtpAsync(email, fullName, CancellationToken.None);
            return await OkAsync(new
            {
                sessionId = session.SessionId,
                resendCooldownSeconds = session.ResendCooldownSeconds,
                expiresInSeconds = session.ExpiresInSeconds
            });
        }
        catch (Exception ex)
        {
            AddMessage(ex.Message);
            return await ResultAsync(new { message = ex.Message }, ApplicationServiceStatus.ValidationError);
        }
    }
}
