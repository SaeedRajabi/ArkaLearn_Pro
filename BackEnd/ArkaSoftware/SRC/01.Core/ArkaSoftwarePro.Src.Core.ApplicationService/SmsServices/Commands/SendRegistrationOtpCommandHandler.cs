using ArkaSoftwarePro.Src.Core.ApplicationService.UsersServices.Helpers;
using ArkaSoftwarePro.Src.Core.Contracts.NotificationSettings;
using ArkaSoftwarePro.Src.Core.Contracts.Sms;
using ArkaSoftwarePro.Src.Core.Contracts.Users.UnitOfWorkContracts;
using ArkaSoftwarePro.Src.Core.RequestResponse.Sms.Commands.SendRegistrationOtp;
using ArkaSoftwarePro.Src.Core.RequestResponse.Users;
using Framework.Src.Core.ApplicationService.Commands;
using Framework.Src.Core.RequestResponse.Commands;
using Framework.Src.Core.RequestResponse.Common;
using Framework.Src.Utilities.OutService.Services;

namespace ArkaSoftwarePro.Src.Core.ApplicationService.SmsServices.Commands;

public class SendRegistrationOtpCommandHandler(
    ArkaSoftwareCMPOutServices outer,
    INotificationSettingsProvider settingsProvider,
    IPhoneVerificationService phoneVerificationService,
    IUserUnitOfWork userUnitOfWork)
    : CommandHandler<SendRegistrationOtpCommand, object>(outer)
{
    public override async Task<CommandResult<object>> Handle(SendRegistrationOtpCommand command)
    {
        var settings = await settingsProvider.GetCurrentAsync();
        if (settings is null || !settings.CanSendSms || !settings.RegistrationOtpEnabled)
        {
            AddMessage("Registration SMS verification is disabled.");
            return await ResultAsync(new { message = "Registration SMS verification is disabled." }, ApplicationServiceStatus.ValidationError);
        }

        if (!IranianPhoneNormalizer.TryNormalizeLocalNumber(command.PhoneNumber, out var localPhone))
        {
            AddMessage("Invalid phone number.");
            return await ResultAsync(new { message = "Invalid phone number." }, ApplicationServiceStatus.ValidationError);
        }

        var userName = command.UserName.Trim();
        var email = command.Email.Trim().ToLowerInvariant();
        var conflict = await RegistrationDuplicateChecker.FindConflictAsync(
            userUnitOfWork.UserCommandRepository,
            email,
            userName,
            localPhone);
        if (conflict is not null)
        {
            var message = RegistrationDuplicateChecker.ToUserMessage(conflict);
            AddMessage(message);
            return await ResultAsync(new { message }, ApplicationServiceStatus.Exist);
        }

        try
        {
            var session = await phoneVerificationService.SendRegistrationOtpAsync(
                command.PhoneNumber,
                userName,
                email,
                command.FullName,
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
