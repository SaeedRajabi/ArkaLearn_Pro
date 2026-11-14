using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
using ArkaSoftwarePro.Src.Core.Contracts.Email;
using ArkaSoftwarePro.Src.Core.Contracts.Services;
using ArkaSoftwarePro.Src.Core.Contracts.Sms;
using ArkaSoftwarePro.Src.Core.Contracts.Users.UserRepositoryContracts.Queries;

namespace ArkaSoftwarePro.Src.Core.ApplicationService.EmailServices;

public sealed class EmailVerificationService(
    IOtpSessionStore sessionStore,
    IEmailService emailService,
    IEmailSettingsProvider emailSettingsProvider,
    IUserQueryRepository userQueryRepository) : IEmailVerificationService
{
    private const int MaxAttempts = 5;
    private static readonly JsonSerializerOptions JsonOptions = new() { PropertyNamingPolicy = JsonNamingPolicy.CamelCase };

    public async Task<ContactEmailOtpSession> SendContactFormOtpAsync(
        string email,
        string fullName,
        CancellationToken cancellationToken = default)
    {
        var runtime = await emailSettingsProvider.GetRuntimeSettingsAsync(cancellationToken);
        var normalizedEmail = NormalizeEmail(email);
        if (!IsValidEmail(normalizedEmail))
            throw new InvalidOperationException("Invalid email address.");

        var cooldownKey = BuildContactCooldownKey(normalizedEmail);
        if (await sessionStore.GetAsync(cooldownKey, cancellationToken) is not null)
            throw new InvalidOperationException("Please wait before requesting a new code.");

        var code = GenerateCode();
        var sessionId = Guid.NewGuid().ToString("N");
        var sessionKey = BuildContactSessionKey(sessionId);
        var session = new EmailOtpCacheEntry
        {
            Email = normalizedEmail,
            FullName = (fullName ?? string.Empty).Trim(),
            CodeHash = Hash(code),
            AttemptsRemaining = MaxAttempts,
            ExpiresAtUtc = DateTime.UtcNow.AddMinutes(runtime.OtpExpiryMinutes)
        };

        await SaveSessionAsync(sessionKey, session, TimeSpan.FromMinutes(runtime.OtpExpiryMinutes), cancellationToken);
        try
        {
            await emailService.SendVerificationCodeAsync(
                normalizedEmail,
                session.FullName,
                code,
                cancellationToken);
        }
        catch
        {
            await sessionStore.RemoveAsync(sessionKey, cancellationToken);
            throw;
        }

        await sessionStore.SetAsync(cooldownKey, "1", TimeSpan.FromSeconds(runtime.OtpResendCooldownSeconds), cancellationToken);

        return new ContactEmailOtpSession
        {
            SessionId = sessionId,
            ResendCooldownSeconds = runtime.OtpResendCooldownSeconds,
            ExpiresInSeconds = runtime.OtpExpiryMinutes * 60
        };
    }

    public async Task<bool> IsContactEmailVerifiedAsync(string sessionId, string email, CancellationToken cancellationToken = default)
    {
        var normalizedEmail = NormalizeEmail(email);
        if (string.IsNullOrWhiteSpace(sessionId) || !IsValidEmail(normalizedEmail))
            return false;

        var session = await GetSessionAsync(BuildContactSessionKey(sessionId), cancellationToken);
        return session is { Verified: true } && string.Equals(session.Email, normalizedEmail, StringComparison.OrdinalIgnoreCase);
    }

    public async Task<bool> VerifyContactEmailOtpAsync(string sessionId, string email, string otpCode, CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(sessionId) || string.IsNullOrWhiteSpace(otpCode))
            return false;

        var normalizedEmail = NormalizeEmail(email);
        if (!IsValidEmail(normalizedEmail))
            return false;

        var key = BuildContactSessionKey(sessionId);
        var session = await GetSessionAsync(key, cancellationToken);
        if (session is null)
            return false;
        if (!string.Equals(session.Email, normalizedEmail, StringComparison.OrdinalIgnoreCase))
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

    public async Task<ProfileEmailOtpSession> SendProfileEmailVerificationOtpAsync(
        long userId,
        CancellationToken cancellationToken = default)
    {
        if (userId <= 0)
            throw new InvalidOperationException("Invalid user.");

        var profile = await userQueryRepository.GetEmailVerificationInfoAsync(userId, cancellationToken);
        if (profile is null)
            throw new InvalidOperationException("User not found.");
        if (profile.EmailVerified)
            throw new InvalidOperationException("Email is already verified.");
        if (string.IsNullOrWhiteSpace(profile.Email) || !IsValidEmail(profile.Email))
            throw new InvalidOperationException("User does not have a valid email address.");

        var runtime = await emailSettingsProvider.GetRuntimeSettingsAsync(cancellationToken);
        var cooldownKey = BuildProfileCooldownKey(userId);
        if (await sessionStore.GetAsync(cooldownKey, cancellationToken) is not null)
            throw new InvalidOperationException("Please wait before requesting a new code.");

        var code = GenerateCode();
        var sessionId = Guid.NewGuid().ToString("N");
        var sessionKey = BuildProfileSessionKey(userId);
        var session = new ProfileEmailOtpCacheEntry
        {
            UserId = userId,
            SessionId = sessionId,
            Email = profile.Email,
            FullName = profile.FullName,
            CodeHash = Hash(code),
            AttemptsRemaining = MaxAttempts,
            ExpiresAtUtc = DateTime.UtcNow.AddMinutes(runtime.OtpExpiryMinutes)
        };

        await SaveProfileSessionAsync(sessionKey, session, TimeSpan.FromMinutes(runtime.OtpExpiryMinutes), cancellationToken);
        try
        {
            await emailService.SendVerificationCodeAsync(
                profile.Email,
                profile.FullName,
                code,
                cancellationToken);
        }
        catch
        {
            await sessionStore.RemoveAsync(sessionKey, cancellationToken);
            throw;
        }

        await sessionStore.SetAsync(cooldownKey, "1", TimeSpan.FromSeconds(runtime.OtpResendCooldownSeconds), cancellationToken);

        return new ProfileEmailOtpSession
        {
            SessionId = sessionId,
            ResendCooldownSeconds = runtime.OtpResendCooldownSeconds,
            ExpiresInSeconds = runtime.OtpExpiryMinutes * 60
        };
    }

    public async Task<bool> VerifyProfileEmailOtpAsync(
        long userId,
        string sessionId,
        string otpCode,
        CancellationToken cancellationToken = default)
    {
        if (userId <= 0 || string.IsNullOrWhiteSpace(sessionId) || string.IsNullOrWhiteSpace(otpCode))
            return false;

        var key = BuildProfileSessionKey(userId);
        var session = await GetProfileSessionAsync(key, cancellationToken);
        if (session is null)
            return false;
        if (session.UserId != userId)
            return false;
        if (!string.Equals(session.SessionId, sessionId, StringComparison.Ordinal))
            return false;
        if (session.ExpiresAtUtc <= DateTime.UtcNow)
            return false;

        if (!VerifyProfileCode(session, otpCode))
        {
            session.AttemptsRemaining--;
            if (session.AttemptsRemaining <= 0)
                await sessionStore.RemoveAsync(key, cancellationToken);
            else
                await SaveProfileSessionAsync(key, session, TimeSpan.FromMinutes(10), cancellationToken);
            return false;
        }

        session.Verified = true;
        await SaveProfileSessionAsync(key, session, TimeSpan.FromMinutes(15), cancellationToken);
        return true;
    }

    public async Task<ProfileEmailOtpSession> SendEmailChangeOtpAsync(
        long userId,
        string newEmail,
        CancellationToken cancellationToken = default)
    {
        if (userId <= 0)
            throw new InvalidOperationException("Invalid user.");

        var normalizedEmail = NormalizeEmail(newEmail);
        if (!IsValidEmail(normalizedEmail))
            throw new InvalidOperationException("Invalid email address.");

        var profile = await userQueryRepository.GetEmailVerificationInfoAsync(userId, cancellationToken);
        if (profile is null)
            throw new InvalidOperationException("User not found.");

        var runtime = await emailSettingsProvider.GetRuntimeSettingsAsync(cancellationToken);
        var cooldownKey = BuildEmailChangeCooldownKey(userId);
        if (await sessionStore.GetAsync(cooldownKey, cancellationToken) is not null)
            throw new InvalidOperationException("Please wait before requesting a new code.");

        var code = GenerateCode();
        var sessionId = Guid.NewGuid().ToString("N");
        var sessionKey = BuildEmailChangeSessionKey(userId);
        var session = new EmailChangeOtpCacheEntry
        {
            UserId = userId,
            SessionId = sessionId,
            NewEmail = normalizedEmail,
            FullName = profile.FullName,
            CodeHash = Hash(code),
            AttemptsRemaining = MaxAttempts,
            ExpiresAtUtc = DateTime.UtcNow.AddMinutes(runtime.OtpExpiryMinutes)
        };

        await SaveEmailChangeSessionAsync(sessionKey, session, TimeSpan.FromMinutes(runtime.OtpExpiryMinutes), cancellationToken);
        try
        {
            await emailService.SendVerificationCodeAsync(
                normalizedEmail,
                profile.FullName,
                code,
                cancellationToken);
        }
        catch
        {
            await sessionStore.RemoveAsync(sessionKey, cancellationToken);
            throw;
        }

        await sessionStore.SetAsync(cooldownKey, "1", TimeSpan.FromSeconds(runtime.OtpResendCooldownSeconds), cancellationToken);

        return new ProfileEmailOtpSession
        {
            SessionId = sessionId,
            ResendCooldownSeconds = runtime.OtpResendCooldownSeconds,
            ExpiresInSeconds = runtime.OtpExpiryMinutes * 60
        };
    }

    public async Task<bool> VerifyEmailChangeOtpAsync(
        long userId,
        string sessionId,
        string newEmail,
        string otpCode,
        CancellationToken cancellationToken = default)
    {
        if (userId <= 0 || string.IsNullOrWhiteSpace(sessionId) || string.IsNullOrWhiteSpace(otpCode))
            return false;

        var normalizedEmail = NormalizeEmail(newEmail);
        if (!IsValidEmail(normalizedEmail))
            return false;

        var key = BuildEmailChangeSessionKey(userId);
        var session = await GetEmailChangeSessionAsync(key, cancellationToken);
        if (session is null)
            return false;
        if (session.UserId != userId)
            return false;
        if (!string.Equals(session.SessionId, sessionId, StringComparison.Ordinal))
            return false;
        if (!string.Equals(session.NewEmail, normalizedEmail, StringComparison.OrdinalIgnoreCase))
            return false;
        if (session.ExpiresAtUtc <= DateTime.UtcNow)
            return false;

        if (!VerifyEmailChangeCode(session, otpCode))
        {
            session.AttemptsRemaining--;
            if (session.AttemptsRemaining <= 0)
                await sessionStore.RemoveAsync(key, cancellationToken);
            else
                await SaveEmailChangeSessionAsync(key, session, TimeSpan.FromMinutes(10), cancellationToken);
            return false;
        }

        session.Verified = true;
        await SaveEmailChangeSessionAsync(key, session, TimeSpan.FromMinutes(15), cancellationToken);
        return true;
    }

    private static string BuildEmailChangeSessionKey(long userId) => $"email:otp:change:{userId}";
    private static string BuildEmailChangeCooldownKey(long userId) => $"email:cooldown:change:{userId}";

    private static bool VerifyEmailChangeCode(EmailChangeOtpCacheEntry session, string code)
        => string.Equals(session.CodeHash, Hash(code.Trim()), StringComparison.OrdinalIgnoreCase);

    private async Task<EmailChangeOtpCacheEntry?> GetEmailChangeSessionAsync(string key, CancellationToken cancellationToken)
    {
        var raw = await sessionStore.GetAsync(key, cancellationToken);
        if (string.IsNullOrWhiteSpace(raw)) return null;

        try
        {
            return JsonSerializer.Deserialize<EmailChangeOtpCacheEntry>(raw, JsonOptions);
        }
        catch (JsonException)
        {
            await sessionStore.RemoveAsync(key, cancellationToken);
            return null;
        }
    }

    private Task SaveEmailChangeSessionAsync(string key, EmailChangeOtpCacheEntry session, TimeSpan ttl, CancellationToken cancellationToken)
    {
        var json = JsonSerializer.Serialize(session, JsonOptions);
        return sessionStore.SetAsync(key, json, ttl, cancellationToken);
    }

    private static string NormalizeEmail(string email) => (email ?? string.Empty).Trim().ToLowerInvariant();

    private static bool IsValidEmail(string email)
        => !string.IsNullOrWhiteSpace(email) && email.Contains('@') && email.Contains('.');

    private static string GenerateCode() => RandomNumberGenerator.GetInt32(100000, 999999).ToString();

    private static string Hash(string code)
    {
        var bytes = SHA256.HashData(Encoding.UTF8.GetBytes(code));
        return Convert.ToHexString(bytes);
    }

    private static bool VerifyCode(EmailOtpCacheEntry session, string code)
        => string.Equals(session.CodeHash, Hash(code.Trim()), StringComparison.OrdinalIgnoreCase);

    private static bool VerifyProfileCode(ProfileEmailOtpCacheEntry session, string code)
        => string.Equals(session.CodeHash, Hash(code.Trim()), StringComparison.OrdinalIgnoreCase);

    private static string BuildContactSessionKey(string sessionId) => $"email:otp:contact:{sessionId}";
    private static string BuildContactCooldownKey(string email) => $"email:cooldown:contact:{email}";
    private static string BuildProfileSessionKey(long userId) => $"email:otp:profile:{userId}";
    private static string BuildProfileCooldownKey(long userId) => $"email:cooldown:profile:{userId}";

    private async Task<EmailOtpCacheEntry?> GetSessionAsync(string key, CancellationToken cancellationToken)
    {
        var raw = await sessionStore.GetAsync(key, cancellationToken);
        if (string.IsNullOrWhiteSpace(raw)) return null;

        try
        {
            return JsonSerializer.Deserialize<EmailOtpCacheEntry>(raw, JsonOptions);
        }
        catch (JsonException)
        {
            await sessionStore.RemoveAsync(key, cancellationToken);
            return null;
        }
    }

    private Task SaveSessionAsync(string key, EmailOtpCacheEntry session, TimeSpan ttl, CancellationToken cancellationToken)
    {
        var json = JsonSerializer.Serialize(session, JsonOptions);
        return sessionStore.SetAsync(key, json, ttl, cancellationToken);
    }

    private async Task<ProfileEmailOtpCacheEntry?> GetProfileSessionAsync(string key, CancellationToken cancellationToken)
    {
        var raw = await sessionStore.GetAsync(key, cancellationToken);
        if (string.IsNullOrWhiteSpace(raw)) return null;

        try
        {
            return JsonSerializer.Deserialize<ProfileEmailOtpCacheEntry>(raw, JsonOptions);
        }
        catch (JsonException)
        {
            await sessionStore.RemoveAsync(key, cancellationToken);
            return null;
        }
    }

    private Task SaveProfileSessionAsync(string key, ProfileEmailOtpCacheEntry session, TimeSpan ttl, CancellationToken cancellationToken)
    {
        var json = JsonSerializer.Serialize(session, JsonOptions);
        return sessionStore.SetAsync(key, json, ttl, cancellationToken);
    }

    private sealed class EmailOtpCacheEntry
    {
        public string Email { get; set; } = string.Empty;
        public string FullName { get; set; } = string.Empty;
        public string CodeHash { get; set; } = string.Empty;
        public int AttemptsRemaining { get; set; }
        public DateTime ExpiresAtUtc { get; set; }
        public bool Verified { get; set; }
    }

    private sealed class ProfileEmailOtpCacheEntry
    {
        public long UserId { get; set; }
        public string SessionId { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string FullName { get; set; } = string.Empty;
        public string CodeHash { get; set; } = string.Empty;
        public int AttemptsRemaining { get; set; }
        public DateTime ExpiresAtUtc { get; set; }
        public bool Verified { get; set; }
    }

    private sealed class EmailChangeOtpCacheEntry
    {
        public long UserId { get; set; }
        public string SessionId { get; set; } = string.Empty;
        public string NewEmail { get; set; } = string.Empty;
        public string FullName { get; set; } = string.Empty;
        public string CodeHash { get; set; } = string.Empty;
        public int AttemptsRemaining { get; set; }
        public DateTime ExpiresAtUtc { get; set; }
        public bool Verified { get; set; }
    }
}
