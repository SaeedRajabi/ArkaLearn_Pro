using ArkaSoftwarePro.Src.Core.Contracts.NotificationSettings;
using ArkaSoftwarePro.Src.Core.Contracts.Sms;
using ArkaSoftwarePro.Src.Core.RequestResponse.Sms.Commands.ConfirmPhoneChange;
using ArkaSoftwarePro.Src.Core.RequestResponse.Sms.Commands.SendPhoneChangeOtp;
using ArkaSoftwarePro.Src.Core.RequestResponse.Users;
using ArkaSoftwarePro.Src.Core.Contracts.Users.UnitOfWorkContracts;
using Framework.Src.Core.ApplicationService.Commands;
using Framework.Src.Core.RequestResponse.Commands;
using Framework.Src.Core.RequestResponse.Common;
using Framework.Src.Utilities.OutService.Services;
using Microsoft.AspNetCore.Http;

namespace ArkaSoftwarePro.Src.Core.ApplicationService.SmsServices.Commands;

public class SendPhoneChangeOtpCommandHandler(
    ArkaSoftwareCMPOutServices outer,
    INotificationSettingsProvider settingsProvider,
    IPhoneVerificationService phoneVerificationService,
    IUserUnitOfWork userUnitOfWork,
    IHttpContextAccessor httpContextAccessor)
    : CommandHandler<SendPhoneChangeOtpCommand, object>(outer)
{
    public const string PhoneAlreadyInUseMessage =
        "Phone number was not verified because this number is already in use by another account.";

    public override async Task<CommandResult<object>> Handle(SendPhoneChangeOtpCommand command)
    {
        var settings = await settingsProvider.GetCurrentAsync();
        if (settings is null || !settings.CanSendSms || !settings.PhoneChangeOtpEnabled)
        {
            AddMessage("Phone change SMS verification is disabled.");
            return await ResultAsync(new { message = "Phone change SMS verification is disabled." }, ApplicationServiceStatus.ValidationError);
        }

        if (!TryGetUserId(out var userId))
            return await ResultAsync(new { message = "Unauthorized." }, ApplicationServiceStatus.ValidationError);

        if (!IranianPhoneNormalizer.TryNormalizeLocalNumber(command.NewPhoneNumber, out var localPhone))
        {
            AddMessage("Invalid phone number.");
            return await ResultAsync(new { message = "Invalid phone number." }, ApplicationServiceStatus.ValidationError);
        }

        if (await IsPhoneTakenByAnotherUserAsync(userId, localPhone))
        {
            AddMessage(PhoneAlreadyInUseMessage);
            return await ResultAsync(new { message = PhoneAlreadyInUseMessage, code = "PHONE_ALREADY_IN_USE" }, ApplicationServiceStatus.ValidationError);
        }

        try
        {
            var session = await phoneVerificationService.SendPhoneChangeOtpAsync(userId, command.NewPhoneNumber, CancellationToken.None);
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

    private async Task<bool> IsPhoneTakenByAnotherUserAsync(long userId, string localPhone)
    {
        return await userUnitOfWork.UserCommandRepository.ExistsAsync(x =>
            x.Id != userId
            && x.PhoneNumber != null
            && x.PhoneNumber.Number == localPhone);
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

public class ConfirmPhoneChangeCommandHandler(
    ArkaSoftwareCMPOutServices outer,
    INotificationSettingsProvider settingsProvider,
    IPhoneVerificationService phoneVerificationService,
    IUserUnitOfWork userUnitOfWork,
    IHttpContextAccessor httpContextAccessor)
    : CommandHandler<ConfirmPhoneChangeCommand, string>(outer)
{
    public override async Task<CommandResult<string>> Handle(ConfirmPhoneChangeCommand command)
    {
        if (!TryGetUserId(out var userId))
            return await ResultAsync("Unauthorized.", ApplicationServiceStatus.ValidationError);

        var settings = await settingsProvider.GetCurrentAsync();
        if (settings is { PhoneChangeOtpEnabled: true, CanSendSms: true })
        {
            var ok = await phoneVerificationService.VerifyPhoneChangeOtpAsync(
                userId,
                command.OtpSessionId,
                command.NewPhoneNumber,
                command.OtpCode,
                CancellationToken.None);
            if (!ok)
            {
                AddMessage("Invalid or expired verification code.");
                return await ResultAsync("Invalid or expired verification code.", ApplicationServiceStatus.ValidationError);
            }
        }

        if (!IranianPhoneNormalizer.TryNormalizeLocalNumber(command.NewPhoneNumber, out var localPhone))
        {
            AddMessage("Invalid phone number.");
            return await ResultAsync("Invalid phone number.", ApplicationServiceStatus.ValidationError);
        }

        var user = await userUnitOfWork.UserCommandRepository.GetAsync(userId);
        if (user is null)
            return await ResultAsync("User not found.", ApplicationServiceStatus.NotFound);

        // Same number already on this account — treat as success (idempotent).
        var currentLocal = user.PhoneNumber?.Number?.Trim();
        if (!string.IsNullOrWhiteSpace(currentLocal)
            && string.Equals(currentLocal, localPhone, StringComparison.Ordinal)
            && user.PhoneNumberVerified)
        {
            return await OkAsync("Phone number updated.");
        }

        if (await IsPhoneTakenByAnotherUserAsync(userId, localPhone))
        {
            AddMessage(SendPhoneChangeOtpCommandHandler.PhoneAlreadyInUseMessage);
            return await ResultAsync(
                SendPhoneChangeOtpCommandHandler.PhoneAlreadyInUseMessage,
                ApplicationServiceStatus.ValidationError);
        }

        user.SetPhoneNumber(IranianPhoneNormalizer.CountryCode, localPhone);
        user.VerifyPhoneNumber();

        try
        {
            await userUnitOfWork.CommitAsync();
        }
        catch (Exception ex) when (IsDuplicatePhoneConstraint(ex))
        {
            AddMessage(SendPhoneChangeOtpCommandHandler.PhoneAlreadyInUseMessage);
            return await ResultAsync(
                SendPhoneChangeOtpCommandHandler.PhoneAlreadyInUseMessage,
                ApplicationServiceStatus.ValidationError);
        }

        return await OkAsync("Phone number updated.");
    }

    private async Task<bool> IsPhoneTakenByAnotherUserAsync(long userId, string localPhone)
    {
        return await userUnitOfWork.UserCommandRepository.ExistsAsync(x =>
            x.Id != userId
            && x.PhoneNumber != null
            && x.PhoneNumber.Number == localPhone);
    }

    private static bool IsDuplicatePhoneConstraint(Exception ex)
    {
        for (var current = ex; current is not null; current = current.InnerException)
        {
            var message = current.Message ?? string.Empty;
            if (message.Contains("IX_Users_PhoneNumber", StringComparison.OrdinalIgnoreCase))
                return true;
            if (message.Contains("duplicate key", StringComparison.OrdinalIgnoreCase)
                && message.Contains("PhoneNumber", StringComparison.OrdinalIgnoreCase))
                return true;
        }

        return false;
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
