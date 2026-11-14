using ArkaSoftwarePro.Src.Core.Contracts.Sms;
using ArkaSoftwarePro.Src.Core.Contracts.Users.SecurityCookieContracts;
using ArkaSoftwarePro.Src.Core.Contracts.Users.SecurityTokenContracts;
using ArkaSoftwarePro.Src.Core.Contracts.Users.UserRepositoryContracts.Commands;
using ArkaSoftwarePro.Src.Core.Domain.UsersAggregate.Entities;
using ArkaSoftwarePro.Src.Core.Domain.UsersAggregate.Enumerations;
using ArkaSoftwarePro.Src.Core.RequestResponse.Users.Commands.ConfirmLoginTwoFactor;
using ArkaSoftwarePro.Src.Core.RequestResponse.Users.Commands.ResendLoginTwoFactorOtp;
using Framework.Src.Core.ApplicationService.Commands;
using Framework.Src.Core.RequestResponse.Commands;
using Framework.Src.Core.RequestResponse.Common;
using Framework.Src.Utilities.OutService.DateTimes;
using Framework.Src.Utilities.OutService.Services;
using Microsoft.AspNetCore.Http;

namespace ArkaSoftwarePro.Src.Core.ApplicationService.UsersServices.Commands;

public class ConfirmLoginTwoFactorCommandHandler(
    ArkaSoftwareCMPOutServices outerServices,
    IUserCommandRepository userCommandRepository,
    IJwtGeneratorSettings jwtGenerateSettings,
    IJwtGenerator jwtGenerate,
    IUserDeviceInfoService userInfoService,
    ICookieManager cookieManger,
    IPhoneVerificationService phoneVerificationService)
    : CommandHandler<ConfirmLoginTwoFactorCommand, object>(outerServices)
{
    public override async Task<CommandResult<object>> Handle(ConfirmLoginTwoFactorCommand command)
    {
        if (string.IsNullOrWhiteSpace(command.TwoFactorSessionId) || string.IsNullOrWhiteSpace(command.OtpCode))
        {
            const string msg = "Verification code is required.";
            result.AddMessage(msg);
            return await ResultAsync(new { message = msg }, ApplicationServiceStatus.ValidationError);
        }

        var challenge = await phoneVerificationService.GetLoginTwoFactorSessionAsync(command.TwoFactorSessionId);
        if (challenge is null)
        {
            const string msg = "Two-factor session is invalid or expired.";
            result.AddMessage(msg);
            return await ResultAsync(new { message = msg, code = "TWO_FACTOR_EXPIRED" }, ApplicationServiceStatus.ValidationError);
        }

        var ok = await phoneVerificationService.VerifyLoginTwoFactorOtpAsync(
            command.TwoFactorSessionId,
            command.OtpCode);
        if (!ok)
        {
            const string msg = "Invalid or expired verification code.";
            result.AddMessage(msg);
            return await ResultAsync(new { message = msg, code = "TWO_FACTOR_INVALID" }, ApplicationServiceStatus.ValidationError);
        }

        var user = await userCommandRepository.GetAsync(challenge.UserId);
        if (user is null || user.IsBlocked())
        {
            result.AddMessage(UserAccountMessages.Blocked);
            return await ResultAsync(new { message = UserAccountMessages.Blocked }, ApplicationServiceStatus.ValidationError);
        }

        if (!user.TwoFactorEnabled)
        {
            const string msg = "Two-factor authentication is not enabled.";
            result.AddMessage(msg);
            return await ResultAsync(new { message = msg }, ApplicationServiceStatus.ValidationError);
        }

        var payload = await LoginSessionFinalizer.CompleteAsync(
            user,
            userCommandRepository,
            jwtGenerateSettings,
            jwtGenerate,
            userInfoService,
            cookieManger,
            _mafiaOuterService);

        await phoneVerificationService.ConsumeLoginTwoFactorSessionAsync(command.TwoFactorSessionId);
        return await ResultAsync(payload, ApplicationServiceStatus.Ok);
    }
}

public class ResendLoginTwoFactorOtpCommandHandler(
    ArkaSoftwareCMPOutServices outerServices,
    IUserCommandRepository userCommandRepository,
    IPhoneVerificationService phoneVerificationService)
    : CommandHandler<ResendLoginTwoFactorOtpCommand, object>(outerServices)
{
    public override async Task<CommandResult<object>> Handle(ResendLoginTwoFactorOtpCommand command)
    {
        var existing = await phoneVerificationService.GetLoginTwoFactorSessionAsync(command.TwoFactorSessionId);
        if (existing is null)
        {
            const string msg = "Two-factor session is invalid or expired.";
            result.AddMessage(msg);
            return await ResultAsync(new { message = msg, code = "TWO_FACTOR_EXPIRED" }, ApplicationServiceStatus.ValidationError);
        }

        var user = await userCommandRepository.GetAsync(existing.UserId);
        var phone = user?.PhoneNumber is not null
                    && !string.IsNullOrWhiteSpace(user.PhoneNumber.Number)
                    && user.PhoneNumberVerified
            ? user.PhoneNumber.Number
            : null;
        var email = user?.Email is not null && !string.IsNullOrWhiteSpace(user.Email.Value)
            ? user.Email.Value
            : null;

        // Prefer the same channel as the previous challenge when possible.
        var preferSms = string.Equals(existing.Channel, "sms", StringComparison.OrdinalIgnoreCase)
                        || (!string.IsNullOrWhiteSpace(existing.PhoneLocal) && phone is not null);
        if (preferSms && phone is null)
            preferSms = false;
        if (!preferSms && email is null && phone is not null)
            preferSms = true;

        if (phone is null && email is null)
        {
            const string msg = "A phone number or email is required for two-factor login.";
            result.AddMessage(msg);
            return await ResultAsync(new { message = msg }, ApplicationServiceStatus.ValidationError);
        }

        try
        {
            await phoneVerificationService.ConsumeLoginTwoFactorSessionAsync(command.TwoFactorSessionId);
            var displayName = user!.UserFullName != null
                ? $"{user.UserFullName.FirstName} {user.UserFullName.LastName}".Trim()
                : user.UserName.Value;
            var session = await phoneVerificationService.SendLoginTwoFactorOtpAsync(
                user.Id,
                preferSms ? phone : null,
                preferSms ? null : email,
                displayName);
            return await OkAsync(new
            {
                requiresTwoFactor = true,
                twoFactorSessionId = session.SessionId,
                channel = session.Channel,
                maskedPhone = session.Channel == "sms" ? session.MaskedDestination : null,
                maskedEmail = session.Channel == "email" ? session.MaskedDestination : null,
                maskedDestination = session.MaskedDestination,
                resendCooldownSeconds = session.ResendCooldownSeconds,
                expiresInSeconds = session.ExpiresInSeconds,
            });
        }
        catch (Exception ex)
        {
            result.AddMessage(ex.Message);
            return await ResultAsync(new { message = ex.Message }, ApplicationServiceStatus.ValidationError);
        }
    }

    internal static string MaskPhone(string localPhone)
    {
        if (string.IsNullOrWhiteSpace(localPhone) || localPhone.Length < 4)
            return "****";
        return $"{localPhone[..2]}****{localPhone[^2..]}";
    }
}

internal static class LoginSessionFinalizer
{
    public static async Task<object> CompleteAsync(
        User user,
        IUserCommandRepository userCommandRepository,
        IJwtGeneratorSettings jwtGenerateSettings,
        IJwtGenerator jwtGenerate,
        IUserDeviceInfoService userInfoService,
        ICookieManager cookieManger,
        ArkaSoftwareCMPOutServices outerService)
    {
        User userGraph = await userCommandRepository.GetGraphAsync(user.Id);
        var currentSession = userGraph.GetCurrentSession();

        if (currentSession! != null! && !currentSession.IsValid())
        {
            currentSession.ExpireSession();
            currentSession = null;
        }
        if (currentSession! == null!)
        {
            if (userGraph.UserSessionsQuantity() >= 5)
                userGraph.RemoveSessions();

            var expiresAt = DateTime.UtcNow.AddDays(jwtGenerateSettings.RefreshTokenLifetimeDays);
            userGraph.AddSession(expiresAt, userInfoService.GetUserInfo().IpAddress, userInfoService.GetUserInfo().UserAgent);
        }

        var accessToken = jwtGenerate.GenerateJwtToken(userGraph);
        await cookieManger.SetAuthCookieAsync(userGraph, accessToken);

        var refreshTokenExpiresAt = DateTime.UtcNow.AddDays(jwtGenerateSettings.RefreshTokenLifetimeDays);
        var newToken = new AuthenticationToken(
            user.Id,
            accessToken,
            refreshTokenExpiresAt,
            DateTime.Now,
            false
        );
        userGraph.AddAuthenticationToken(newToken);
        userGraph.LoginAttemptIncrement();
        userGraph.CreateUserActionLog(
            ActionType.LOGIN,
            DateTimeKind.Local.GetNow().ToIranTimeZoneDateTime(),
            userInfoService.GetUserInfo().IpAddress,
            userInfoService.GetUserInfo().UserAgent);
        outerService.CurrentUserContext.SetUserId(user.Id.ToString());
        await userCommandRepository.CommitAsync();

        var phoneLocal = user.PhoneNumber?.Number;
        return new
        {
            userData = new
            {
                Token = accessToken,
                Id = userGraph.Id.ToString(),
                Name = user.UserFullName != null
                    ? $"{user.UserFullName.FirstName} {user.UserFullName.LastName}".Trim()
                    : user.UserName.ToString(),
                FullName = user.UserFullName != null
                    ? $"{user.UserFullName.FirstName} {user.UserFullName.LastName}".Trim()
                    : user.UserName.Value,
                UserName = user.UserName.Value,
                Email = user.Email.Value,
                EmailVerified = user.EmailVerified,
                PhoneNumber = phoneLocal,
                PhoneNumberVerified = user.PhoneNumberVerified,
                TwoFactorEnabled = user.TwoFactorEnabled,
                TeacherId = userGraph.Teacher != null ? userGraph.Teacher.Id : (long?)null,
                AvatarUrl =
                    user.ProfileImage != null && user.ProfileImage.ImageURL != null
                        ? user.ProfileImage.ImageURL
                        : (user.UserName.Value.Length >= 2 ? user.UserName.Value.Substring(0, 2) : user.UserName.Value),
                Role = user.Role switch
                {
                    UserRole.STUDENT => "student",
                    UserRole.TEACHER => "teacher",
                    UserRole.ADMIN => "admin",
                    _ => "user"
                },
                Status = user.Status.ToString(),
                LastLogin = user.LastLoginDateTime
            }
        };
    }
}
