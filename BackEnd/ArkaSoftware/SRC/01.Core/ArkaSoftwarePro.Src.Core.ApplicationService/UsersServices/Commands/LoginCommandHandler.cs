using System;
using ArkaSoftwarePro.Src.Core.Contracts.Auth;
using ArkaSoftwarePro.Src.Core.Contracts.IPBlacklist.IPBlacklistRepositoryContracts.Commands;
using ArkaSoftwarePro.Src.Core.Contracts.IPBlacklist.IPBlacklistRepositoryContracts.Queries;
using ArkaSoftwarePro.Src.Core.Contracts.Sms;
using ArkaSoftwarePro.Src.Core.Contracts.Users.SecurityCookieContracts;
using ArkaSoftwarePro.Src.Core.Contracts.Users.SecurityTokenContracts;
using ArkaSoftwarePro.Src.Core.ApplicationService.UsersServices;
using ArkaSoftwarePro.Src.Core.Contracts.Users.UserRepositoryContracts.Commands;
using ArkaSoftwarePro.Src.Core.Domain.UsersAggregate.Entities;
using ArkaSoftwarePro.Src.Core.Domain.UsersAggregate.Enumerations;
using ArkaSoftwarePro.Src.Core.RequestResponse.Users.Commands.LoginUsers;
using Framework.Src.Core.ApplicationService.Commands;
using Framework.Src.Core.RequestResponse.Commands;
using Framework.Src.Core.RequestResponse.Common;
using Framework.Src.Utilities.OutService.Services;
using Microsoft.AspNetCore.Http;

namespace ArkaSoftwarePro.Src.Core.ApplicationService.UsersServices.Commands
{
    public class LoginCommandHandler(
        ArkaSoftwareCMPOutServices outerServices,
        IUserCommandRepository userCommandRepository,
        IJwtGeneratorSettings jwtGenerateSettings,
        IJwtGenerator jwtGenerate,
        IRateLimiterService rateLimiter,
        IIPBlacklistQueryRepository ipBlacklistQueryRepository,
        IIPBlacklistCommandRepository ipBlacklistCommandRepository,
        IUserDeviceInfoService userInfoService,
        IHttpContextAccessor httpContextAccessor,
        ICookieManager cookieManger,
        IPhoneVerificationService phoneVerificationService,
        ILoginPuzzleCaptchaService loginPuzzleCaptchaService)
        : CommandHandler<LoginUser, object>(outerServices)
    {
        private readonly IHttpContextAccessor _httpContextAccessor = httpContextAccessor;

        public override async Task<CommandResult<object>> Handle(LoginUser command)
        {
            try
            {
                var userInfo = userInfoService.GetUserInfo();
                var ipAddress = userInfo.IpAddress;
                var deviceInfo = userInfo.UserAgent;
                var loginKey = command.UserNameOrEmail!.Trim().ToLowerInvariant();

                if (!string.IsNullOrWhiteSpace(ipAddress) && await ipBlacklistQueryRepository.IsIpBlockedAsync(ipAddress))
                {
                    const string ipBlockedMessage = "IP_BLOCKED";
                    result.AddMessage(ipBlockedMessage);
                    return await ResultAsync(new { message = ipBlockedMessage, code = "IP_BLOCKED" }, ApplicationServiceStatus.ValidationError);
                }

                if (rateLimiter.IsBlocked(ipAddress))
                {
                    const string rateLimitMessage = "Too many failed attempts. Try again later.";
                    result.AddMessage(rateLimitMessage);
                    return await ResultAsync(new { message = rateLimitMessage }, ApplicationServiceStatus.ValidationError);
                }

                var failedCount = rateLimiter.GetFailedAttemptCount(ipAddress ?? string.Empty);
                var captchaPassed = loginPuzzleCaptchaService.TryValidate(
                    command.CaptchaId,
                    command.CaptchaSlidePercent,
                    ipAddress);
                var isAdminDashboardClient = string.Equals(
                    command.ClientApp?.Trim(),
                    "AdminDashboard",
                    StringComparison.OrdinalIgnoreCase);
                var suspicious = isAdminDashboardClient
                    && loginPuzzleCaptchaService.IsSuspicious(
                        ipAddress,
                        deviceInfo,
                        failedCount,
                        captchaPassed);

                if (suspicious)
                {
                    var challenge = loginPuzzleCaptchaService.CreateChallenge(ipAddress);
                    const string captchaMessage = "Please complete the human verification puzzle.";
                    result.AddMessage(captchaMessage);
                    return await ResultAsync(new
                    {
                        requiresCaptcha = true,
                        captchaId = challenge.CaptchaId,
                        targetPercent = challenge.TargetPercent,
                        tolerancePercent = challenge.TolerancePercent,
                        message = captchaMessage,
                        code = "CAPTCHA_REQUIRED",
                    }, ApplicationServiceStatus.Ok);
                }

                User user = userCommandRepository.FindByUserNameAsync(loginKey);
                if (user == null! || !user.VerifyPassword(command.Password!))
                {
                    var attemptResult = rateLimiter.RegisterFailedAttempt(ipAddress);
                    if (attemptResult == LoginAttemptResult.PermanentlyBlocked && !string.IsNullOrWhiteSpace(ipAddress))
                    {
                        var existing = await ipBlacklistCommandRepository.GetActiveByIpAsync(ipAddress);
                        if (existing is null)
                        {
                            await ipBlacklistCommandRepository.InsertEntryAsync(
                                Domain.UsersAggregate.Entities.IPBlacklist.Create(
                                    ipAddress,
                                    deviceInfo ?? "Unknown Device",
                                    "Too many failed login attempts.",
                                    permanent: true));
                            await ipBlacklistCommandRepository.CommitAsync();
                        }

                        const string ipBlockedMessage = "IP_BLOCKED";
                        result.AddMessage(ipBlockedMessage);
                        return await ResultAsync(new { message = ipBlockedMessage, code = "IP_BLOCKED" }, ApplicationServiceStatus.ValidationError);
                    }

                    // After a failed attempt on AdminDashboard, require puzzle next.
                    var nextFailed = rateLimiter.GetFailedAttemptCount(ipAddress ?? string.Empty);
                    if (isAdminDashboardClient && nextFailed >= 1)
                    {
                        var challenge = loginPuzzleCaptchaService.CreateChallenge(ipAddress);
                        const string invalidCredentialsMessage = "Invalid credentials";
                        result.AddMessage(invalidCredentialsMessage);
                        // Must be Ok so captcha payload is returned by Create() (ValidationError drops Data).
                        return await ResultAsync(new
                        {
                            loginFailed = true,
                            message = invalidCredentialsMessage,
                            requiresCaptcha = true,
                            captchaId = challenge.CaptchaId,
                            targetPercent = challenge.TargetPercent,
                            tolerancePercent = challenge.TolerancePercent,
                            code = "INVALID_CREDENTIALS",
                        }, ApplicationServiceStatus.Ok);
                    }

                    const string invalidCreds = "Invalid credentials";
                    result.AddMessage(invalidCreds);
                    return await ResultAsync(new { message = invalidCreds }, ApplicationServiceStatus.ValidationError);
                }

                if (user.IsBlocked())
                {
                    result.AddMessage(UserAccountMessages.Blocked);
                    return await ResultAsync(new { message = UserAccountMessages.Blocked }, ApplicationServiceStatus.ValidationError);
                }

                user.Login(user.UserName, command.Password!);
                rateLimiter.Clear(ipAddress);

                if (user.TwoFactorEnabled)
                {
                    var phone = user.PhoneNumber is not null
                                && !string.IsNullOrWhiteSpace(user.PhoneNumber.Number)
                                && user.PhoneNumberVerified
                        ? user.PhoneNumber.Number
                        : null;
                    var email = user.Email is not null && !string.IsNullOrWhiteSpace(user.Email.Value)
                        ? user.Email.Value
                        : null;

                    if (phone is null && email is null)
                    {
                        const string msg = "Two-factor authentication is enabled but no phone or email is available.";
                        result.AddMessage(msg);
                        return await ResultAsync(new { message = msg, code = "TWO_FACTOR_DESTINATION_REQUIRED" }, ApplicationServiceStatus.ValidationError);
                    }

                    try
                    {
                        var displayName = user.UserFullName != null
                            ? $"{user.UserFullName.FirstName} {user.UserFullName.LastName}".Trim()
                            : user.UserName.Value;
                        // Priority: verified phone (SMS) over email.
                        var session = await phoneVerificationService.SendLoginTwoFactorOtpAsync(
                            user.Id,
                            phone,
                            phone is null ? email : null,
                            displayName);
                        return await ResultAsync(new
                        {
                            requiresTwoFactor = true,
                            twoFactorSessionId = session.SessionId,
                            channel = session.Channel,
                            maskedPhone = session.Channel == "sms" ? session.MaskedDestination : null,
                            maskedEmail = session.Channel == "email" ? session.MaskedDestination : null,
                            maskedDestination = session.MaskedDestination,
                            resendCooldownSeconds = session.ResendCooldownSeconds,
                            expiresInSeconds = session.ExpiresInSeconds,
                        }, ApplicationServiceStatus.Ok);
                    }
                    catch (Exception ex)
                    {
                        result.AddMessage(ex.Message);
                        return await ResultAsync(new { message = ex.Message, code = "TWO_FACTOR_SEND_FAILED" }, ApplicationServiceStatus.ValidationError);
                    }
                }

                var payload = await LoginSessionFinalizer.CompleteAsync(
                    user,
                    userCommandRepository,
                    jwtGenerateSettings,
                    jwtGenerate,
                    userInfoService,
                    cookieManger,
                    _mafiaOuterService);
                return await ResultAsync(payload, ApplicationServiceStatus.Ok);
            }
            catch (Exception ex)
            {
                System.Diagnostics.Debug.WriteLine($"Login error: {ex.Message}");
                System.Diagnostics.Debug.WriteLine($"Stack trace: {ex.StackTrace}");
                return await ResultAsync(new { message = $"Login failed: {ex.Message}" }, ApplicationServiceStatus.Exception);
            }
        }
    }
}
