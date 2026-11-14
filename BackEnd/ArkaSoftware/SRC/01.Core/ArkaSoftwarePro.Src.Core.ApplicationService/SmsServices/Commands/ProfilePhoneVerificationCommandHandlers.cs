using ArkaSoftwarePro.Src.Core.Contracts.NotificationSettings;
using ArkaSoftwarePro.Src.Core.Contracts.Sms;
using ArkaSoftwarePro.Src.Core.Contracts.Users.UnitOfWorkContracts;
using ArkaSoftwarePro.Src.Core.RequestResponse.Sms.Commands.ConfirmProfilePhoneVerification;
using ArkaSoftwarePro.Src.Core.RequestResponse.Sms.Commands.SendProfilePhoneVerificationOtp;
using ArkaSoftwarePro.Src.Core.RequestResponse.Users;
using Framework.Src.Core.ApplicationService.Commands;
using Framework.Src.Core.RequestResponse.Commands;
using Framework.Src.Core.RequestResponse.Common;
using Framework.Src.Utilities.OutService.Services;
using Microsoft.AspNetCore.Http;

namespace ArkaSoftwarePro.Src.Core.ApplicationService.SmsServices.Commands;

public class SendProfilePhoneVerificationOtpCommandHandler(
    ArkaSoftwareCMPOutServices outer,
    INotificationSettingsProvider settingsProvider,
    IPhoneVerificationService phoneVerificationService,
    IUserUnitOfWork userUnitOfWork,
    IHttpContextAccessor httpContextAccessor)
    : CommandHandler<SendProfilePhoneVerificationOtpCommand, object>(outer)
{
    public override async Task<CommandResult<object>> Handle(SendProfilePhoneVerificationOtpCommand command)
    {
        var settings = await settingsProvider.GetCurrentAsync();
        if (settings is null || !settings.CanSendSms || !settings.PhoneChangeOtpEnabled)
        {
            AddMessage("Phone verification SMS is disabled.");
            return await ResultAsync(new { message = "Phone verification SMS is disabled." }, ApplicationServiceStatus.ValidationError);
        }

        if (!TryGetUserId(out var userId))
            return await ResultAsync(new { message = "Unauthorized." }, ApplicationServiceStatus.ValidationError);

        var user = await userUnitOfWork.UserCommandRepository.GetAsync(userId);
        if (user is null)
            return await ResultAsync(new { message = "User not found." }, ApplicationServiceStatus.NotFound);

        if (user.PhoneNumberVerified)
        {
            AddMessage("Phone number is already verified.");
            return await ResultAsync(new { message = "Phone number is already verified." }, ApplicationServiceStatus.ValidationError);
        }

        var currentLocal = user.PhoneNumber?.Number?.Trim();
        if (string.IsNullOrWhiteSpace(currentLocal)
            || !IranianPhoneNormalizer.TryNormalizeLocalNumber(currentLocal, out var localPhone))
        {
            AddMessage("User does not have a valid phone number.");
            return await ResultAsync(new { message = "User does not have a valid phone number." }, ApplicationServiceStatus.ValidationError);
        }

        try
        {
            var session = await phoneVerificationService.SendProfilePhoneVerificationOtpAsync(
                userId,
                localPhone,
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

    private bool TryGetUserId(out long userId)
    {
        userId = 0;
        var claim = httpContextAccessor.HttpContext?.User?.FindFirst("userId")?.Value
            ?? httpContextAccessor.HttpContext?.User?.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value
            ?? httpContextAccessor.HttpContext?.User?.FindFirst("sub")?.Value;
        return long.TryParse(claim, out userId);
    }
}

public class ConfirmProfilePhoneVerificationCommandHandler(
    ArkaSoftwareCMPOutServices outer,
    INotificationSettingsProvider settingsProvider,
    IPhoneVerificationService phoneVerificationService,
    IUserUnitOfWork userUnitOfWork,
    IHttpContextAccessor httpContextAccessor)
    : CommandHandler<ConfirmProfilePhoneVerificationCommand, string>(outer)
{
    public override async Task<CommandResult<string>> Handle(ConfirmProfilePhoneVerificationCommand command)
    {
        if (!TryGetUserId(out var userId))
            return await ResultAsync("Unauthorized.", ApplicationServiceStatus.ValidationError);

        var user = await userUnitOfWork.UserCommandRepository.GetAsync(userId);
        if (user is null)
            return await ResultAsync("User not found.", ApplicationServiceStatus.NotFound);

        if (user.PhoneNumberVerified)
            return await OkAsync("Phone number verified.");

        var currentLocal = user.PhoneNumber?.Number?.Trim();
        if (string.IsNullOrWhiteSpace(currentLocal)
            || !IranianPhoneNormalizer.TryNormalizeLocalNumber(currentLocal, out var localPhone))
        {
            AddMessage("User does not have a valid phone number.");
            return await ResultAsync("User does not have a valid phone number.", ApplicationServiceStatus.ValidationError);
        }

        var settings = await settingsProvider.GetCurrentAsync();
        if (settings is { PhoneChangeOtpEnabled: true, CanSendSms: true })
        {
            var ok = await phoneVerificationService.VerifyProfilePhoneVerificationOtpAsync(
                userId,
                command.OtpSessionId,
                localPhone,
                command.OtpCode,
                CancellationToken.None);
            if (!ok)
            {
                AddMessage("Invalid or expired verification code.");
                return await ResultAsync("Invalid or expired verification code.", ApplicationServiceStatus.ValidationError);
            }
        }

        user.VerifyPhoneNumber();
        await userUnitOfWork.CommitAsync();
        return await OkAsync("Phone number verified.");
    }

    private bool TryGetUserId(out long userId)
    {
        userId = 0;
        var claim = httpContextAccessor.HttpContext?.User?.FindFirst("userId")?.Value
            ?? httpContextAccessor.HttpContext?.User?.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value
            ?? httpContextAccessor.HttpContext?.User?.FindFirst("sub")?.Value;
        return long.TryParse(claim, out userId);
    }
}
