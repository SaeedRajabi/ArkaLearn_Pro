namespace ArkaSoftwarePro.Src.Core.Contracts.Email;

public sealed class ContactEmailOtpSession
{
    public string SessionId { get; init; } = string.Empty;
    public int ResendCooldownSeconds { get; init; }
    public int ExpiresInSeconds { get; init; }
}

public sealed class ProfileEmailOtpSession
{
    public string SessionId { get; init; } = string.Empty;
    public int ResendCooldownSeconds { get; init; }
    public int ExpiresInSeconds { get; init; }
}

public interface IEmailVerificationService
{
    Task<ContactEmailOtpSession> SendContactFormOtpAsync(
        string email,
        string fullName,
        CancellationToken cancellationToken = default);

    Task<bool> IsContactEmailVerifiedAsync(
        string sessionId,
        string email,
        CancellationToken cancellationToken = default);

    Task<bool> VerifyContactEmailOtpAsync(
        string sessionId,
        string email,
        string otpCode,
        CancellationToken cancellationToken = default);

    Task<ProfileEmailOtpSession> SendProfileEmailVerificationOtpAsync(
        long userId,
        CancellationToken cancellationToken = default);

    Task<bool> VerifyProfileEmailOtpAsync(
        long userId,
        string sessionId,
        string otpCode,
        CancellationToken cancellationToken = default);

    Task<ProfileEmailOtpSession> SendEmailChangeOtpAsync(
        long userId,
        string newEmail,
        CancellationToken cancellationToken = default);

    Task<bool> VerifyEmailChangeOtpAsync(
        long userId,
        string sessionId,
        string newEmail,
        string otpCode,
        CancellationToken cancellationToken = default);
}
