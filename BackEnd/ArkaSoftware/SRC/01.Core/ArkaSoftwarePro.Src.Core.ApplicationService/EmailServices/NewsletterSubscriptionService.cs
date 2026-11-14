using System.Net.Mail;
using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
using ArkaSoftwarePro.Src.Core.Contracts.Email;
using ArkaSoftwarePro.Src.Core.Contracts.Newsletter.NewsletterRepositoryContracts.Commands;
using ArkaSoftwarePro.Src.Core.Contracts.Services;
using ArkaSoftwarePro.Src.Core.Contracts.Sms;
using ArkaSoftwarePro.Src.Core.Domain.NewsletterAggregate.Entities;

namespace ArkaSoftwarePro.Src.Core.ApplicationService.EmailServices;

public sealed class NewsletterSubscriptionService(
    IOtpSessionStore sessionStore,
    IEmailService emailService,
    IEmailSettingsProvider emailSettingsProvider,
    INewsletterSubscriberCommandRepository subscriberRepository) : INewsletterSubscriptionService
{
    private const int MaxAttempts = 5;
    private static readonly JsonSerializerOptions JsonOptions = new() { PropertyNamingPolicy = JsonNamingPolicy.CamelCase };

    public async Task<NewsletterOtpSession> RequestSubscribeOtpAsync(
        string email,
        CancellationToken cancellationToken = default)
    {
        var runtime = await emailSettingsProvider.GetRuntimeSettingsAsync(cancellationToken);
        var normalizedEmail = NewsletterSubscriber.NormalizeEmail(email);
        if (!IsValidEmail(normalizedEmail))
            throw new InvalidOperationException("Invalid email address.");

        var existing = await subscriberRepository.GetByEmailAsync(normalizedEmail, cancellationToken);
        if (existing is { IsActiveSubscriber: true })
            throw new InvalidOperationException("This email is already subscribed to the newsletter.");

        var cooldownKey = BuildCooldownKey(normalizedEmail);
        if (await sessionStore.GetAsync(cooldownKey, cancellationToken) is not null)
            throw new InvalidOperationException("Please wait before requesting a new code.");

        if (existing is null)
        {
            await subscriberRepository.InsertAsync(NewsletterSubscriber.CreatePending(normalizedEmail));
            await subscriberRepository.CommitAsync();
        }

        var code = GenerateCode();
        var sessionId = Guid.NewGuid().ToString("N");
        var sessionKey = BuildSessionKey(sessionId);
        var session = new NewsletterOtpCacheEntry
        {
            Email = normalizedEmail,
            CodeHash = Hash(code),
            AttemptsRemaining = MaxAttempts,
            ExpiresAtUtc = DateTime.UtcNow.AddMinutes(runtime.OtpExpiryMinutes)
        };

        await SaveSessionAsync(sessionKey, session, TimeSpan.FromMinutes(runtime.OtpExpiryMinutes), cancellationToken);
        try
        {
            await emailService.SendVerificationCodeAsync(
                normalizedEmail,
                string.Empty,
                code,
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
            TimeSpan.FromSeconds(runtime.OtpResendCooldownSeconds),
            cancellationToken);

        return new NewsletterOtpSession
        {
            SessionId = sessionId,
            ResendCooldownSeconds = runtime.OtpResendCooldownSeconds,
            ExpiresInSeconds = runtime.OtpExpiryMinutes * 60
        };
    }

    public async Task ConfirmSubscribeAsync(
        string email,
        string sessionId,
        string otpCode,
        CancellationToken cancellationToken = default)
    {
        var normalizedEmail = NewsletterSubscriber.NormalizeEmail(email);
        if (!IsValidEmail(normalizedEmail))
            throw new InvalidOperationException("Invalid email address.");

        if (string.IsNullOrWhiteSpace(sessionId) || string.IsNullOrWhiteSpace(otpCode))
            throw new InvalidOperationException("Invalid or expired verification code.");

        var key = BuildSessionKey(sessionId);
        var session = await GetSessionAsync(key, cancellationToken);
        if (session is null ||
            !string.Equals(session.Email, normalizedEmail, StringComparison.OrdinalIgnoreCase) ||
            session.ExpiresAtUtc <= DateTime.UtcNow)
            throw new InvalidOperationException("Invalid or expired verification code.");

        if (!string.Equals(session.CodeHash, Hash(otpCode.Trim()), StringComparison.OrdinalIgnoreCase))
        {
            session.AttemptsRemaining--;
            if (session.AttemptsRemaining <= 0)
                await sessionStore.RemoveAsync(key, cancellationToken);
            else
                await SaveSessionAsync(key, session, TimeSpan.FromMinutes(10), cancellationToken);
            throw new InvalidOperationException("Invalid or expired verification code.");
        }

        await sessionStore.RemoveAsync(key, cancellationToken);

        var subscriber = await subscriberRepository.GetByEmailAsync(normalizedEmail, cancellationToken);
        if (subscriber is null)
        {
            subscriber = NewsletterSubscriber.CreateVerified(normalizedEmail);
            await subscriberRepository.InsertAsync(subscriber);
        }
        else
        {
            subscriber.MarkVerified();
        }

        await subscriberRepository.CommitAsync();
    }

    public async Task EnsureVerifiedSubscriberAsync(
        string email,
        long? userId = null,
        CancellationToken cancellationToken = default)
    {
        var normalizedEmail = NewsletterSubscriber.NormalizeEmail(email);
        if (!IsValidEmail(normalizedEmail))
            return;

        var existing = await subscriberRepository.GetByEmailAsync(normalizedEmail, cancellationToken);
        if (existing is null)
        {
            await subscriberRepository.InsertAsync(NewsletterSubscriber.CreateVerified(normalizedEmail, userId));
            await subscriberRepository.CommitAsync();
            return;
        }

        if (!existing.IsActiveSubscriber)
            existing.MarkVerified(userId);
        else if (userId is > 0)
            existing.LinkUser(userId.Value);

        await subscriberRepository.CommitAsync();
    }

    public async Task UnsubscribeAsync(string email, CancellationToken cancellationToken = default)
    {
        var normalizedEmail = NewsletterSubscriber.NormalizeEmail(email);
        if (!IsValidEmail(normalizedEmail))
            throw new InvalidOperationException("Invalid email address.");

        var existing = await subscriberRepository.GetByEmailAsync(normalizedEmail, cancellationToken);
        if (existing is null)
            return;

        existing.Unsubscribe();
        await subscriberRepository.CommitAsync();
    }

    private static string GenerateCode()
    {
        var value = RandomNumberGenerator.GetInt32(0, 1_000_000);
        return value.ToString("D6");
    }

    private static string Hash(string value)
    {
        var bytes = SHA256.HashData(Encoding.UTF8.GetBytes(value));
        return Convert.ToHexString(bytes);
    }

    private static bool IsValidEmail(string email)
    {
        if (string.IsNullOrWhiteSpace(email) || email.Length > 256)
            return false;
        try
        {
            _ = new MailAddress(email);
            return email.Contains('@');
        }
        catch
        {
            return false;
        }
    }

    private static string BuildSessionKey(string sessionId) => $"email:otp:newsletter:{sessionId}";
    private static string BuildCooldownKey(string email) => $"email:cooldown:newsletter:{email}";

    private async Task<NewsletterOtpCacheEntry?> GetSessionAsync(string key, CancellationToken cancellationToken)
    {
        var raw = await sessionStore.GetAsync(key, cancellationToken);
        if (string.IsNullOrWhiteSpace(raw))
            return null;

        try
        {
            return JsonSerializer.Deserialize<NewsletterOtpCacheEntry>(raw, JsonOptions);
        }
        catch (JsonException)
        {
            await sessionStore.RemoveAsync(key, cancellationToken);
            return null;
        }
    }

    private Task SaveSessionAsync(
        string key,
        NewsletterOtpCacheEntry session,
        TimeSpan ttl,
        CancellationToken cancellationToken)
    {
        var json = JsonSerializer.Serialize(session, JsonOptions);
        return sessionStore.SetAsync(key, json, ttl, cancellationToken);
    }

    private sealed class NewsletterOtpCacheEntry
    {
        public string Email { get; set; } = string.Empty;
        public string CodeHash { get; set; } = string.Empty;
        public int AttemptsRemaining { get; set; }
        public DateTime ExpiresAtUtc { get; set; }
    }
}
