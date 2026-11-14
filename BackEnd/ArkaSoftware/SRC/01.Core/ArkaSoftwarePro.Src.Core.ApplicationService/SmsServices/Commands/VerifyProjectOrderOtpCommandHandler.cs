using ArkaSoftwarePro.Src.Core.Contracts.Sms;
using ArkaSoftwarePro.Src.Core.RequestResponse.Sms.Commands.VerifyProjectOrderOtp;
using ArkaSoftwarePro.Src.Core.RequestResponse.Users;
using Framework.Src.Core.ApplicationService.Commands;
using Framework.Src.Core.RequestResponse.Commands;
using Framework.Src.Core.RequestResponse.Common;
using Framework.Src.Utilities.OutService.Services;

namespace ArkaSoftwarePro.Src.Core.ApplicationService.SmsServices.Commands;

public class VerifyProjectOrderOtpCommandHandler(
    ArkaSoftwareCMPOutServices outer,
    IPhoneVerificationService phoneVerificationService)
    : CommandHandler<VerifyProjectOrderOtpCommand, object>(outer)
{
    public override async Task<CommandResult<object>> Handle(VerifyProjectOrderOtpCommand command)
    {
        if (string.IsNullOrWhiteSpace(command.SessionId) || string.IsNullOrWhiteSpace(command.OtpCode))
        {
            AddMessage("Verification code is required.");
            return await ResultAsync(new { message = "Verification code is required.", verified = false }, ApplicationServiceStatus.ValidationError);
        }

        if (!IranianPhoneNormalizer.TryNormalizeLocalNumber(command.PhoneNumber, out _))
        {
            AddMessage("Invalid phone number.");
            return await ResultAsync(new { message = "Invalid phone number.", verified = false }, ApplicationServiceStatus.ValidationError);
        }

        var verified = await phoneVerificationService.VerifyProjectOrderOtpAsync(
            command.SessionId.Trim(),
            command.PhoneNumber,
            command.OtpCode.Trim(),
            CancellationToken.None);

        if (!verified)
        {
            AddMessage("Invalid or expired verification code.");
            return await ResultAsync(new { message = "Invalid or expired verification code.", verified = false }, ApplicationServiceStatus.ValidationError);
        }

        return await OkAsync(new { verified = true });
    }
}
