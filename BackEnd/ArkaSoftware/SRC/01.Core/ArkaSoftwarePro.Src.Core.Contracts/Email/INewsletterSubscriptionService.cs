namespace ArkaSoftwarePro.Src.Core.Contracts.Email;

public sealed class NewsletterOtpSession
{
    public string SessionId { get; init; } = string.Empty;
    public int ResendCooldownSeconds { get; init; }
    public int ExpiresInSeconds { get; init; }
}

public interface INewsletterSubscriptionService
{
    /// <summary>Guest subscribe: send OTP to email.</summary>
    Task<NewsletterOtpSession> RequestSubscribeOtpAsync(
        string email,
        CancellationToken cancellationToken = default);

    /// <summary>Guest subscribe: confirm OTP and mark verified.</summary>
    Task ConfirmSubscribeAsync(
        string email,
        string sessionId,
        string otpCode,
        CancellationToken cancellationToken = default);

    /// <summary>Student registration: subscribe immediately as verified (no OTP).</summary>
    Task EnsureVerifiedSubscriberAsync(
        string email,
        long? userId = null,
        CancellationToken cancellationToken = default);

    Task UnsubscribeAsync(string email, CancellationToken cancellationToken = default);
}
