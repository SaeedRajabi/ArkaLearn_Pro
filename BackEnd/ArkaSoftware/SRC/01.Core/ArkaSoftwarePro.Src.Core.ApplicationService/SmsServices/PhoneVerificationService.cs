using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
using ArkaSoftwarePro.Src.Core.Contracts.Email;
using ArkaSoftwarePro.Src.Core.Contracts.NotificationSettings;
using ArkaSoftwarePro.Src.Core.Contracts.SecuritySettings;
using ArkaSoftwarePro.Src.Core.Contracts.Services;
using ArkaSoftwarePro.Src.Core.Contracts.Sms;
using ArkaSoftwarePro.Src.Core.RequestResponse.Users;

namespace ArkaSoftwarePro.Src.Core.ApplicationService.SmsServices;

public sealed class PhoneVerificationService(
    IOtpSessionStore sessionStore,
    ISmsIrClient smsIrClient,
    IEmailService emailService,
    IEmailSettingsProvider emailSettingsProvider,
    INotificationSettingsProvider settingsProvider,
    ISecuritySettingsProvider securitySettingsProvider) : IPhoneVerificationService
{
    private const int MaxAttempts = 5;
    private static readonly JsonSerializerOptions JsonOptions = new() { PropertyNamingPolicy = JsonNamingPolicy.CamelCase };

    public async Task<RegistrationOtpSession> SendRegistrationOtpAsync(
        string phoneNumber,
        string userName,
        string email,
        string fullName,
        CancellationToken cancellationToken = default)
    {
        var settings = await RequireRegistrationEnabledAsync(cancellationToken);
        if (!IranianPhoneNormalizer.TryNormalizeLocalNumber(phoneNumber, out var localPhone))
            throw new InvalidOperationException("Invalid phone number.");

        var cooldownKey = BuildCooldownKey(PhoneVerificationPurpose.Registration, localPhone);
        if (await sessionStore.GetAsync(cooldownKey, cancellationToken) is not null)
            throw new InvalidOperationException("Please wait before requesting a new code.");

        var code = GenerateCode();
        var sessionId = Guid.NewGuid().ToString("N");
        var sessionKey = BuildSessionKey(PhoneVerificationPurpose.Registration, sessionId);
        var session = new OtpCacheEntry
        {
            Purpose = PhoneVerificationPurpose.Registration,
            PhoneLocal = localPhone,
            CodeHash = Hash(code),
            UserName = userName.Trim(),
            Email = email.Trim().ToLowerInvariant(),
            FullName = fullName.Trim(),
            AttemptsRemaining = MaxAttempts,
            ExpiresAtUtc = DateTime.UtcNow.AddMinutes(settings.OtpExpiryMinutes)
        };

        await SaveSessionAsync(sessionKey, session, TimeSpan.FromMinutes(settings.OtpExpiryMinutes), cancellationToken);
        try
        {
            await smsIrClient.SendVerifyAsync(
                localPhone,
                settings.RegistrationVerifyTemplateId,
                [new SmsVerifyParameter { Name = "Code", Value = code }],
                cancellationToken);
        }
        catch
        {
            await sessionStore.RemoveAsync(sessionKey, cancellationToken);
            throw;
        }

        await sessionStore.SetAsync(
            cooldownKey,
            "1",
            TimeSpan.FromSeconds(settings.OtpResendCooldownSeconds),
            cancellationToken);

        return new RegistrationOtpSession
        {
            SessionId = sessionId,
            ResendCooldownSeconds = settings.OtpResendCooldownSeconds,
            ExpiresInSeconds = settings.OtpExpiryMinutes * 60
        };
    }

    public async Task<bool> VerifyRegistrationOtpAsync(string sessionId, string phoneNumber, string otpCode, CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(sessionId) || string.IsNullOrWhiteSpace(otpCode))
            return false;
        if (!IranianPhoneNormalizer.TryNormalizeLocalNumber(phoneNumber, out var localPhone))
            return false;

        var key = BuildSessionKey(PhoneVerificationPurpose.Registration, sessionId);
        var session = await GetSessionAsync(key, cancellationToken);
        if (session is null || session.Purpose != PhoneVerificationPurpose.Registration)
            return false;
        if (!string.Equals(session.PhoneLocal, localPhone, StringComparison.Ordinal))
            return false;
        if (session.ExpiresAtUtc <= DateTime.UtcNow)
            return false;

        if (!VerifyCode(session, otpCode))
        {
            session.AttemptsRemaining--;
            if (session.AttemptsRemaining <= 0)
                await sessionStore.RemoveAsync(key, cancellationToken);
            else
                await SaveSessionAsync(key, session, TimeSpan.FromMinutes(10), cancellationToken);
            return false;
        }

        session.Verified = true;
        await SaveSessionAsync(key, session, TimeSpan.FromMinutes(15), cancellationToken);
        return true;
    }

    public async Task<PhoneChangeOtpSession> SendPhoneChangeOtpAsync(long userId, string newPhoneNumber, CancellationToken cancellationToken = default)
    {
        var settings = await RequirePhoneChangeEnabledAsync(cancellationToken);
        if (!IranianPhoneNormalizer.TryNormalizeLocalNumber(newPhoneNumber, out var localPhone))
            throw new InvalidOperationException("Invalid phone number.");

        var cooldownKey = BuildCooldownKey(PhoneVerificationPurpose.PhoneChange, $"{userId}:{localPhone}");
        if (await sessionStore.GetAsync(cooldownKey, cancellationToken) is not null)
            throw new InvalidOperationException("Please wait before requesting a new code.");

        var code = GenerateCode();
        var sessionId = Guid.NewGuid().ToString("N");
        var sessionKey = BuildSessionKey(PhoneVerificationPurpose.PhoneChange, sessionId);
        var session = new OtpCacheEntry
        {
            Purpose = PhoneVerificationPurpose.PhoneChange,
            PhoneLocal = localPhone,
            CodeHash = Hash(code),
            UserId = userId,
            AttemptsRemaining = MaxAttempts,
            ExpiresAtUtc = DateTime.UtcNow.AddMinutes(settings.OtpExpiryMinutes)
        };

        await SaveSessionAsync(sessionKey, session, TimeSpan.FromMinutes(settings.OtpExpiryMinutes), cancellationToken);
        try
        {
            await smsIrClient.SendVerifyAsync(
                localPhone,
                settings.PhoneChangeVerifyTemplateId,
                [new SmsVerifyParameter { Name = "Code", Value = code }],
                cancellationToken);
        }
        catch
        {
            await sessionStore.RemoveAsync(sessionKey, cancellationToken);
            throw;
        }

        await sessionStore.SetAsync(
            cooldownKey,
            "1",
            TimeSpan.FromSeconds(settings.OtpResendCooldownSeconds),
            cancellationToken);

        return new PhoneChangeOtpSession
        {
            SessionId = sessionId,
            ResendCooldownSeconds = settings.OtpResendCooldownSeconds,
            ExpiresInSeconds = settings.OtpExpiryMinutes * 60
        };
    }

    public async Task<bool> VerifyPhoneChangeOtpAsync(long userId, string sessionId, string newPhoneNumber, string otpCode, CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(sessionId) || string.IsNullOrWhiteSpace(otpCode))
            return false;
        if (!IranianPhoneNormalizer.TryNormalizeLocalNumber(newPhoneNumber, out var localPhone))
            return false;

        var key = BuildSessionKey(PhoneVerificationPurpose.PhoneChange, sessionId);
        var session = await GetSessionAsync(key, cancellationToken);
        if (session is null || session.Purpose != PhoneVerificationPurpose.PhoneChange)
            return false;
        if (session.UserId != userId)
            return false;
        if (!string.Equals(session.PhoneLocal, localPhone, StringComparison.Ordinal))
            return false;
        if (session.ExpiresAtUtc <= DateTime.UtcNow)
            return false;

        if (!VerifyCode(session, otpCode))
        {
            session.AttemptsRemaining--;
            if (session.AttemptsRemaining <= 0)
                await sessionStore.RemoveAsync(key, cancellationToken);
            else
                await SaveSessionAsync(key, session, TimeSpan.FromMinutes(10), cancellationToken);
            return false;
        }

        session.Verified = true;
        await SaveSessionAsync(key, session, TimeSpan.FromMinutes(15), cancellationToken);
        return true;
    }

    public async Task<PhoneChangeOtpSession> SendProfilePhoneVerificationOtpAsync(
        long userId,
        string phoneNumber,
        CancellationToken cancellationToken = default)
    {
        var settings = await RequirePhoneChangeEnabledAsync(cancellationToken);
        if (!IranianPhoneNormalizer.TryNormalizeLocalNumber(phoneNumber, out var localPhone))
            throw new InvalidOperationException("Invalid phone number.");

        var cooldownKey = BuildCooldownKey(PhoneVerificationPurpose.ProfileVerification, $"{userId}:{localPhone}");
        if (await sessionStore.GetAsync(cooldownKey, cancellationToken) is not null)
            throw new InvalidOperationException("Please wait before requesting a new code.");

        var code = GenerateCode();
        var sessionId = Guid.NewGuid().ToString("N");
        var sessionKey = BuildSessionKey(PhoneVerificationPurpose.ProfileVerification, sessionId);
        var session = new OtpCacheEntry
        {
            Purpose = PhoneVerificationPurpose.ProfileVerification,
            PhoneLocal = localPhone,
            CodeHash = Hash(code),
            UserId = userId,
            AttemptsRemaining = MaxAttempts,
            ExpiresAtUtc = DateTime.UtcNow.AddMinutes(settings.OtpExpiryMinutes)
        };

        await SaveSessionAsync(sessionKey, session, TimeSpan.FromMinutes(settings.OtpExpiryMinutes), cancellationToken);
        try
        {
            await smsIrClient.SendVerifyAsync(
                localPhone,
                settings.PhoneChangeVerifyTemplateId,
                [new SmsVerifyParameter { Name = "Code", Value = code }],
                cancellationToken);
        }
        catch
        {
            await sessionStore.RemoveAsync(sessionKey, cancellationToken);
            throw;
        }

        await sessionStore.SetAsync(
            cooldownKey,
            "1",
            TimeSpan.FromSeconds(settings.OtpResendCooldownSeconds),
            cancellationToken);

        return new PhoneChangeOtpSession
        {
            SessionId = sessionId,
            ResendCooldownSeconds = settings.OtpResendCooldownSeconds,
            ExpiresInSeconds = settings.OtpExpiryMinutes * 60
        };
    }

    public async Task<bool> VerifyProfilePhoneVerificationOtpAsync(
        long userId,
        string sessionId,
        string phoneNumber,
        string otpCode,
        CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(sessionId) || string.IsNullOrWhiteSpace(otpCode))
            return false;
        if (!IranianPhoneNormalizer.TryNormalizeLocalNumber(phoneNumber, out var localPhone))
            return false;

        var key = BuildSessionKey(PhoneVerificationPurpose.ProfileVerification, sessionId);
        var session = await GetSessionAsync(key, cancellationToken);
        if (session is null || session.Purpose != PhoneVerificationPurpose.ProfileVerification)
            return false;
        if (session.UserId != userId)
            return false;
        if (!string.Equals(session.PhoneLocal, localPhone, StringComparison.Ordinal))
            return false;
        if (session.ExpiresAtUtc <= DateTime.UtcNow)
            return false;

        if (!VerifyCode(session, otpCode))
        {
            session.AttemptsRemaining--;
            if (session.AttemptsRemaining <= 0)
                await sessionStore.RemoveAsync(key, cancellationToken);
            else
                await SaveSessionAsync(key, session, TimeSpan.FromMinutes(10), cancellationToken);
            return false;
        }

        session.Verified = true;
        await SaveSessionAsync(key, session, TimeSpan.FromMinutes(15), cancellationToken);
        return true;
    }

    public async Task<bool> IsRegistrationVerifiedAsync(string sessionId, string phoneNumber, CancellationToken cancellationToken = default)
    {
        if (!IranianPhoneNormalizer.TryNormalizeLocalNumber(phoneNumber, out var localPhone))
            return false;
        var session = await GetSessionAsync(BuildSessionKey(PhoneVerificationPurpose.Registration, sessionId), cancellationToken);
        return session is { Verified: true, Purpose: PhoneVerificationPurpose.Registration, PhoneLocal: var phone }
               && string.Equals(phone, localPhone, StringComparison.Ordinal);
    }

    public async Task<RegistrationOtpSession> SendProjectOrderOtpAsync(
        string phoneNumber,
        string firstName,
        string lastName,
        CancellationToken cancellationToken = default)
    {
        var settings = await RequireRegistrationEnabledAsync(cancellationToken);
        if (!IranianPhoneNormalizer.TryNormalizeLocalNumber(phoneNumber, out var localPhone))
            throw new InvalidOperationException("Invalid phone number.");

        var cooldownKey = BuildCooldownKey(PhoneVerificationPurpose.ProjectOrder, localPhone);
        if (await sessionStore.GetAsync(cooldownKey, cancellationToken) is not null)
            throw new InvalidOperationException("Please wait before requesting a new code.");

        var code = GenerateCode();
        var sessionId = Guid.NewGuid().ToString("N");
        var sessionKey = BuildSessionKey(PhoneVerificationPurpose.ProjectOrder, sessionId);
        var session = new OtpCacheEntry
        {
            Purpose = PhoneVerificationPurpose.ProjectOrder,
            PhoneLocal = localPhone,
            CodeHash = Hash(code),
            UserName = firstName.Trim(),
            FullName = lastName.Trim(),
            AttemptsRemaining = MaxAttempts,
            ExpiresAtUtc = DateTime.UtcNow.AddMinutes(settings.OtpExpiryMinutes)
        };

        await SaveSessionAsync(sessionKey, session, TimeSpan.FromMinutes(settings.OtpExpiryMinutes), cancellationToken);
        try
        {
            await smsIrClient.SendVerifyAsync(
                localPhone,
                settings.RegistrationVerifyTemplateId,
                [new SmsVerifyParameter { Name = "Code", Value = code }],
                cancellationToken);
        }
        catch
        {
            await sessionStore.RemoveAsync(sessionKey, cancellationToken);
            throw;
        }

        await sessionStore.SetAsync(
            cooldownKey,
            "1",
            TimeSpan.FromSeconds(settings.OtpResendCooldownSeconds),
            cancellationToken);

        return new RegistrationOtpSession
        {
            SessionId = sessionId,
            ResendCooldownSeconds = settings.OtpResendCooldownSeconds,
            ExpiresInSeconds = settings.OtpExpiryMinutes * 60
        };
    }

    public async Task<bool> VerifyProjectOrderOtpAsync(string sessionId, string phoneNumber, string otpCode, CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(sessionId) || string.IsNullOrWhiteSpace(otpCode))
            return false;
        if (!IranianPhoneNormalizer.TryNormalizeLocalNumber(phoneNumber, out var localPhone))
            return false;

        var key = BuildSessionKey(PhoneVerificationPurpose.ProjectOrder, sessionId);
        var session = await GetSessionAsync(key, cancellationToken);
        if (session is null || session.Purpose != PhoneVerificationPurpose.ProjectOrder)
            return false;
        if (!string.Equals(session.PhoneLocal, localPhone, StringComparison.Ordinal))
            return false;
        if (session.ExpiresAtUtc <= DateTime.UtcNow)
            return false;

        if (!VerifyCode(session, otpCode))
        {
            session.AttemptsRemaining--;
            if (session.AttemptsRemaining <= 0)
                await sessionStore.RemoveAsync(key, cancellationToken);
            else
                await SaveSessionAsync(key, session, TimeSpan.FromMinutes(10), cancellationToken);
            return false;
        }

        session.Verified = true;
        await SaveSessionAsync(key, session, TimeSpan.FromMinutes(15), cancellationToken);
        return true;
    }

    public async Task<bool> IsProjectOrderVerifiedAsync(string sessionId, string phoneNumber, CancellationToken cancellationToken = default)
    {
        if (!IranianPhoneNormalizer.TryNormalizeLocalNumber(phoneNumber, out var localPhone))
            return false;
        var session = await GetSessionAsync(BuildSessionKey(PhoneVerificationPurpose.ProjectOrder, sessionId), cancellationToken);
        return session is { Verified: true, Purpose: PhoneVerificationPurpose.ProjectOrder, PhoneLocal: var phone }
               && string.Equals(phone, localPhone, StringComparison.Ordinal);
    }

    public async Task<RegistrationOtpSession> SendIpUnblockOtpAsync(
        string phoneNumber,
        string fullName,
        CancellationToken cancellationToken = default)
    {
        var smsSettings = await RequireRegistrationEnabledAsync(cancellationToken);
        var securitySettings = await securitySettingsProvider.GetCurrentAsync(cancellationToken);
        if (!IranianPhoneNormalizer.TryNormalizeLocalNumber(phoneNumber, out var localPhone))
            throw new InvalidOperationException("Invalid phone number.");

        var cooldownKey = BuildCooldownKey(PhoneVerificationPurpose.IpUnblock, localPhone);
        if (await sessionStore.GetAsync(cooldownKey, cancellationToken) is not null)
            throw new InvalidOperationException("Please wait before requesting a new code.");

        var code = GenerateCode();
        var sessionId = Guid.NewGuid().ToString("N");
        var sessionKey = BuildSessionKey(PhoneVerificationPurpose.IpUnblock, sessionId);
        var expiryMinutes = securitySettings.IpUnblockOtpExpiryMinutes;
        var session = new OtpCacheEntry
        {
            Purpose = PhoneVerificationPurpose.IpUnblock,
            PhoneLocal = localPhone,
            CodeHash = Hash(code),
            FullName = fullName.Trim(),
            AttemptsRemaining = MaxAttempts,
            ExpiresAtUtc = DateTime.UtcNow.AddMinutes(expiryMinutes)
        };

        await SaveSessionAsync(sessionKey, session, TimeSpan.FromMinutes(expiryMinutes), cancellationToken);
        try
        {
            await smsIrClient.SendVerifyAsync(
                localPhone,
                smsSettings.RegistrationVerifyTemplateId,
                [new SmsVerifyParameter { Name = "Code", Value = code }],
                cancellationToken);
        }
        catch
        {
            await sessionStore.RemoveAsync(sessionKey, cancellationToken);
            throw;
        }

        await sessionStore.SetAsync(
            cooldownKey,
            "1",
            TimeSpan.FromSeconds(securitySettings.IpUnblockOtpResendCooldownSeconds),
            cancellationToken);

        return new RegistrationOtpSession
        {
            SessionId = sessionId,
            ResendCooldownSeconds = securitySettings.IpUnblockOtpResendCooldownSeconds,
            ExpiresInSeconds = expiryMinutes * 60
        };
    }

    public async Task<bool> VerifyIpUnblockOtpAsync(string sessionId, string phoneNumber, string otpCode, CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(sessionId) || string.IsNullOrWhiteSpace(otpCode))
            return false;
        if (!IranianPhoneNormalizer.TryNormalizeLocalNumber(phoneNumber, out var localPhone))
            return false;

        var key = BuildSessionKey(PhoneVerificationPurpose.IpUnblock, sessionId);
        var session = await GetSessionAsync(key, cancellationToken);
        if (session is null || session.Purpose != PhoneVerificationPurpose.IpUnblock)
            return false;
        if (!string.Equals(session.PhoneLocal, localPhone, StringComparison.Ordinal))
            return false;
        if (session.ExpiresAtUtc <= DateTime.UtcNow)
            return false;

        if (!VerifyCode(session, otpCode))
        {
            session.AttemptsRemaining--;
            if (session.AttemptsRemaining <= 0)
                await sessionStore.RemoveAsync(key, cancellationToken);
            else
                await SaveSessionAsync(key, session, TimeSpan.FromMinutes(10), cancellationToken);
            return false;
        }

        session.Verified = true;
        await SaveSessionAsync(key, session, TimeSpan.FromMinutes(15), cancellationToken);
        return true;
    }

    public async Task<bool> IsIpUnblockVerifiedAsync(string sessionId, string phoneNumber, CancellationToken cancellationToken = default)
    {
        if (!IranianPhoneNormalizer.TryNormalizeLocalNumber(phoneNumber, out var localPhone))
            return false;
        var session = await GetSessionAsync(BuildSessionKey(PhoneVerificationPurpose.IpUnblock, sessionId), cancellationToken);
        return session is { Verified: true, Purpose: PhoneVerificationPurpose.IpUnblock, PhoneLocal: var phone }
               && string.Equals(phone, localPhone, StringComparison.Ordinal);
    }

    public async Task<LoginTwoFactorOtpSession> SendLoginTwoFactorOtpAsync(
        long userId,
        string? phoneLocalNumber,
        string? email,
        string recipientName,
        CancellationToken cancellationToken = default)
    {
        var useSms = !string.IsNullOrWhiteSpace(phoneLocalNumber);
        string localPhone = string.Empty;
        string normalizedEmail = string.Empty;

        if (useSms)
        {
            if (!IranianPhoneNormalizer.TryNormalizeLocalNumber(phoneLocalNumber!, out localPhone))
                throw new InvalidOperationException("Invalid phone number.");
        }
        else
        {
            normalizedEmail = (email ?? string.Empty).Trim().ToLowerInvariant();
            if (string.IsNullOrWhiteSpace(normalizedEmail) || !normalizedEmail.Contains('@'))
                throw new InvalidOperationException("A verified phone number or email address is required for two-factor login.");
        }

        var channel = useSms ? "sms" : "email";
        var cooldownSuffix = useSms ? $"{userId}:{localPhone}" : $"{userId}:{normalizedEmail}";
        var cooldownKey = BuildCooldownKey(PhoneVerificationPurpose.LoginTwoFactor, cooldownSuffix);
        if (await sessionStore.GetAsync(cooldownKey, cancellationToken) is not null)
            throw new InvalidOperationException("Please wait before requesting a new code.");

        int expiryMinutes;
        int resendCooldownSeconds;
        if (useSms)
        {
            var settings = await RequireLoginTwoFactorSmsEnabledAsync(cancellationToken);
            expiryMinutes = settings.OtpExpiryMinutes;
            resendCooldownSeconds = settings.OtpResendCooldownSeconds;
        }
        else
        {
            var emailRuntime = await emailSettingsProvider.GetRuntimeSettingsAsync(cancellationToken);
            expiryMinutes = Math.Clamp(emailRuntime.OtpExpiryMinutes, 1, 30);
            resendCooldownSeconds = Math.Clamp(emailRuntime.OtpResendCooldownSeconds, 30, 600);
        }

        var code = GenerateCode();
        var sessionId = Guid.NewGuid().ToString("N");
        var sessionKey = BuildSessionKey(PhoneVerificationPurpose.LoginTwoFactor, sessionId);
        var session = new OtpCacheEntry
        {
            Purpose = PhoneVerificationPurpose.LoginTwoFactor,
            PhoneLocal = localPhone,
            Email = normalizedEmail,
            FullName = (recipientName ?? string.Empty).Trim(),
            Channel = channel,
            CodeHash = Hash(code),
            UserId = userId,
            AttemptsRemaining = MaxAttempts,
            ExpiresAtUtc = DateTime.UtcNow.AddMinutes(expiryMinutes),
            PasswordVerified = true,
        };

        await SaveSessionAsync(sessionKey, session, TimeSpan.FromMinutes(expiryMinutes), cancellationToken);
        try
        {
            if (useSms)
            {
                var settings = await RequireLoginTwoFactorSmsEnabledAsync(cancellationToken);
                var templateId = settings.PhoneChangeVerifyTemplateId > 0
                    ? settings.PhoneChangeVerifyTemplateId
                    : settings.RegistrationVerifyTemplateId;
                await smsIrClient.SendVerifyAsync(
                    localPhone,
                    templateId,
                    [new SmsVerifyParameter { Name = "Code", Value = code }],
                    cancellationToken);
            }
            else
            {
                await emailService.SendVerificationCodeAsync(
                    normalizedEmail,
                    string.IsNullOrWhiteSpace(session.FullName) ? normalizedEmail : session.FullName,
                    code,
                    cancellationToken);
            }
        }
        catch
        {
            await sessionStore.RemoveAsync(sessionKey, cancellationToken);
            throw;
        }

        await sessionStore.SetAsync(
            cooldownKey,
            "1",
            TimeSpan.FromSeconds(resendCooldownSeconds),
            cancellationToken);

        return new LoginTwoFactorOtpSession
        {
            SessionId = sessionId,
            UserId = userId,
            Channel = channel,
            PhoneLocal = localPhone,
            Email = normalizedEmail,
            MaskedDestination = useSms ? MaskPhone(localPhone) : MaskEmail(normalizedEmail),
            ResendCooldownSeconds = resendCooldownSeconds,
            ExpiresInSeconds = expiryMinutes * 60,
        };
    }

    public async Task<bool> VerifyLoginTwoFactorOtpAsync(
        string sessionId,
        string otpCode,
        CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(sessionId) || string.IsNullOrWhiteSpace(otpCode))
            return false;

        var key = BuildSessionKey(PhoneVerificationPurpose.LoginTwoFactor, sessionId);
        var session = await GetSessionAsync(key, cancellationToken);
        if (session is null || session.Purpose != PhoneVerificationPurpose.LoginTwoFactor)
            return false;
        if (session.UserId is not > 0 || !session.PasswordVerified)
            return false;
        if (session.ExpiresAtUtc <= DateTime.UtcNow)
            return false;

        if (!VerifyCode(session, otpCode))
        {
            session.AttemptsRemaining--;
            if (session.AttemptsRemaining <= 0)
                await sessionStore.RemoveAsync(key, cancellationToken);
            else
                await SaveSessionAsync(key, session, TimeSpan.FromMinutes(10), cancellationToken);
            return false;
        }

        session.Verified = true;
        await SaveSessionAsync(key, session, TimeSpan.FromMinutes(15), cancellationToken);
        return true;
    }

    public async Task<LoginTwoFactorOtpSession?> GetLoginTwoFactorSessionAsync(
        string sessionId,
        CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(sessionId))
            return null;
        var session = await GetSessionAsync(BuildSessionKey(PhoneVerificationPurpose.LoginTwoFactor, sessionId), cancellationToken);
        if (session is null || session.Purpose != PhoneVerificationPurpose.LoginTwoFactor || session.UserId is not > 0)
            return null;
        if (session.ExpiresAtUtc <= DateTime.UtcNow)
            return null;

        var settings = await settingsProvider.GetCurrentAsync(cancellationToken);
        return new LoginTwoFactorOtpSession
        {
            SessionId = sessionId,
            UserId = session.UserId!.Value,
            Channel = string.IsNullOrWhiteSpace(session.Channel)
                ? (string.IsNullOrWhiteSpace(session.PhoneLocal) ? "email" : "sms")
                : session.Channel,
            PhoneLocal = session.PhoneLocal,
            Email = session.Email,
            MaskedDestination = !string.IsNullOrWhiteSpace(session.PhoneLocal)
                ? MaskPhone(session.PhoneLocal)
                : MaskEmail(session.Email),
            ResendCooldownSeconds = settings?.OtpResendCooldownSeconds ?? 120,
            ExpiresInSeconds = Math.Max(0, (int)(session.ExpiresAtUtc - DateTime.UtcNow).TotalSeconds),
        };
    }

    public Task ConsumeLoginTwoFactorSessionAsync(string sessionId, CancellationToken cancellationToken = default)
        => sessionStore.RemoveAsync(BuildSessionKey(PhoneVerificationPurpose.LoginTwoFactor, sessionId), cancellationToken);

    private async Task<ArkaSoftwarePro.Src.Core.Domain.NotificationSettingsAggregate.Entities.NotificationSettings> RequireRegistrationEnabledAsync(CancellationToken cancellationToken)
    {
        var settings = await settingsProvider.GetCurrentAsync(cancellationToken);
        if (settings is null || !settings.CanSendSms || !settings.RegistrationOtpEnabled)
            throw new InvalidOperationException("Registration SMS verification is disabled.");
        if (settings.RegistrationVerifyTemplateId <= 0)
            throw new InvalidOperationException("Registration SMS template is not configured.");
        return settings;
    }

    private async Task<ArkaSoftwarePro.Src.Core.Domain.NotificationSettingsAggregate.Entities.NotificationSettings> RequireLoginTwoFactorSmsEnabledAsync(CancellationToken cancellationToken)
    {
        var settings = await settingsProvider.GetCurrentAsync(cancellationToken);
        if (settings is null || !settings.CanSendSms)
            throw new InvalidOperationException("SMS verification is disabled.");
        var templateId = settings.PhoneChangeVerifyTemplateId > 0
            ? settings.PhoneChangeVerifyTemplateId
            : settings.RegistrationVerifyTemplateId;
        if (templateId <= 0)
            throw new InvalidOperationException("SMS template is not configured.");
        return settings;
    }

    private async Task<ArkaSoftwarePro.Src.Core.Domain.NotificationSettingsAggregate.Entities.NotificationSettings> RequirePhoneChangeEnabledAsync(CancellationToken cancellationToken)
    {
        var settings = await settingsProvider.GetCurrentAsync(cancellationToken);
        if (settings is null || !settings.CanSendSms || !settings.PhoneChangeOtpEnabled)
            throw new InvalidOperationException("Phone change SMS verification is disabled.");
        if (settings.PhoneChangeVerifyTemplateId <= 0)
            throw new InvalidOperationException("Phone change SMS template is not configured.");
        return settings;
    }

    private static string MaskPhone(string localPhone)
    {
        if (string.IsNullOrWhiteSpace(localPhone) || localPhone.Length < 4)
            return "****";
        return $"{localPhone[..2]}****{localPhone[^2..]}";
    }

    private static string MaskEmail(string email)
    {
        if (string.IsNullOrWhiteSpace(email) || !email.Contains('@'))
            return "****";
        var parts = email.Split('@', 2);
        var local = parts[0];
        var domain = parts[1];
        var visible = local.Length <= 2 ? local[..1] : local[..2];
        return $"{visible}***@{domain}";
    }

    private static string BuildSessionKey(PhoneVerificationPurpose purpose, string sessionId) => $"sms:otp:{(int)purpose}:{sessionId}";
    private static string BuildCooldownKey(PhoneVerificationPurpose purpose, string suffix) => $"sms:cooldown:{(int)purpose}:{suffix}";
    private static string GenerateCode() => RandomNumberGenerator.GetInt32(100000, 999999).ToString();
    private static string Hash(string code) => Convert.ToHexString(SHA256.HashData(Encoding.UTF8.GetBytes(code)));
    private static bool VerifyCode(OtpCacheEntry session, string code) => string.Equals(session.CodeHash, Hash(code.Trim()), StringComparison.OrdinalIgnoreCase);

    private Task SaveSessionAsync(string key, OtpCacheEntry session, TimeSpan ttl, CancellationToken cancellationToken)
        => sessionStore.SetAsync(key, JsonSerializer.Serialize(session, JsonOptions), ttl, cancellationToken);

    private async Task<OtpCacheEntry?> GetSessionAsync(string key, CancellationToken cancellationToken)
    {
        var json = await sessionStore.GetAsync(key, cancellationToken);
        if (string.IsNullOrWhiteSpace(json)) return null;
        try { return JsonSerializer.Deserialize<OtpCacheEntry>(json, JsonOptions); }
        catch { return null; }
    }

    private sealed class OtpCacheEntry
    {
        public PhoneVerificationPurpose Purpose { get; set; }
        public string PhoneLocal { get; set; } = string.Empty;
        public string CodeHash { get; set; } = string.Empty;
        public string UserName { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string FullName { get; set; } = string.Empty;
        public string Channel { get; set; } = string.Empty;
        public long? UserId { get; set; }
        public int AttemptsRemaining { get; set; }
        public DateTime ExpiresAtUtc { get; set; }
        public bool Verified { get; set; }
        public bool PasswordVerified { get; set; }
    }
}
