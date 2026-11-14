using ArkaSoftwarePro.Src.Core.Contracts.NotificationSettings;
using ArkaSoftwarePro.Src.Core.Contracts.Sms;
using ArkaSoftwarePro.Src.Core.RequestResponse.Sms.Commands.SendProjectOrderOtp;
using ArkaSoftwarePro.Src.Core.RequestResponse.Users;
using Framework.Src.Core.ApplicationService.Commands;
using Framework.Src.Core.RequestResponse.Commands;
using Framework.Src.Core.RequestResponse.Common;
using Framework.Src.Utilities.OutService.Services;

namespace ArkaSoftwarePro.Src.Core.ApplicationService.SmsServices.Commands;

public class SendProjectOrderOtpCommandHandler(
    ArkaSoftwareCMPOutServices outer,
    INotificationSettingsProvider settingsProvider,
    IPhoneVerificationService phoneVerificationService)
    : CommandHandler<SendProjectOrderOtpCommand, object>(outer)
{
    public override async Task<CommandResult<object>> Handle(SendProjectOrderOtpCommand command)
    {
        var settings = await settingsProvider.GetCurrentAsync();
        if (settings is null || !settings.CanSendSms || !settings.RegistrationOtpEnabled)
        {
            AddMessage("Phone SMS verification is disabled.");
            return await ResultAsync(new { message = "Phone SMS verification is disabled." }, ApplicationServiceStatus.ValidationError);
        }

        var firstName = (command.FirstName ?? string.Empty).Trim();
        var lastName = (command.LastName ?? string.Empty).Trim();
        if (firstName.Length < 2)
        {
            AddMessage("First name is required.");
            return await ResultAsync(new { message = "First name is required." }, ApplicationServiceStatus.ValidationError);
        }

        if (lastName.Length < 2)
        {
            AddMessage("Last name is required.");
            return await ResultAsync(new { message = "Last name is required." }, ApplicationServiceStatus.ValidationError);
        }

        if (!IranianPhoneNormalizer.TryNormalizeLocalNumber(command.PhoneNumber, out _))
        {
            AddMessage("Invalid phone number.");
            return await ResultAsync(new { message = "Invalid phone number." }, ApplicationServiceStatus.ValidationError);
        }

        try
        {
            var session = await phoneVerificationService.SendProjectOrderOtpAsync(
                command.PhoneNumber,
                firstName,
                lastName,
                CancellationToken.None);
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
