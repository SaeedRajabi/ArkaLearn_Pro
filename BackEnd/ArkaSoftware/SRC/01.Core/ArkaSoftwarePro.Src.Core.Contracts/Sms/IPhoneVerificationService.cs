namespace ArkaSoftwarePro.Src.Core.Contracts.Sms;

public enum PhoneVerificationPurpose
{
    Registration = 1,
    PhoneChange = 2,
    ProjectOrder = 3,
    IpUnblock = 4,
    LoginTwoFactor = 5,
    ProfileVerification = 6,
}

public sealed class RegistrationOtpSession
{
    public string SessionId { get; init; } = string.Empty;
    public int ResendCooldownSeconds { get; init; }
    public int ExpiresInSeconds { get; init; }
}

public sealed class PhoneChangeOtpSession
{
    public string SessionId { get; init; } = string.Empty;
    public int ResendCooldownSeconds { get; init; }
    public int ExpiresInSeconds { get; init; }
}

public sealed class LoginTwoFactorOtpSession
{
    public string SessionId { get; init; } = string.Empty;
    public long UserId { get; init; }
    /// <summary>sms | email</summary>
    public string Channel { get; init; } = "sms";
    public string PhoneLocal { get; init; } = string.Empty;
    public string Email { get; init; } = string.Empty;
    public string MaskedDestination { get; init; } = string.Empty;
    public int ResendCooldownSeconds { get; init; }
    public int ExpiresInSeconds { get; init; }
}

public interface IPhoneVerificationService
{
    Task<RegistrationOtpSession> SendRegistrationOtpAsync(
        string phoneNumber,
        string userName,
        string email,
        string fullName,
        CancellationToken cancellationToken = default);

    Task<bool> VerifyRegistrationOtpAsync(string sessionId, string phoneNumber, string otpCode, CancellationToken cancellationToken = default);

    Task<PhoneChangeOtpSession> SendPhoneChangeOtpAsync(long userId, string newPhoneNumber, CancellationToken cancellationToken = default);

    Task<bool> VerifyPhoneChangeOtpAsync(long userId, string sessionId, string newPhoneNumber, string otpCode, CancellationToken cancellationToken = default);

    /// <summary>
    /// Sends OTP to the user's existing phone number (profile verification, not a number change).
    /// </summary>
    Task<PhoneChangeOtpSession> SendProfilePhoneVerificationOtpAsync(long userId, string phoneNumber, CancellationToken cancellationToken = default);

    Task<bool> VerifyProfilePhoneVerificationOtpAsync(long userId, string sessionId, string phoneNumber, string otpCode, CancellationToken cancellationToken = default);

    Task<bool> IsRegistrationVerifiedAsync(string sessionId, string phoneNumber, CancellationToken cancellationToken = default);

    Task<RegistrationOtpSession> SendProjectOrderOtpAsync(
        string phoneNumber,
        string firstName,
        string lastName,
        CancellationToken cancellationToken = default);

    Task<bool> VerifyProjectOrderOtpAsync(string sessionId, string phoneNumber, string otpCode, CancellationToken cancellationToken = default);

    Task<bool> IsProjectOrderVerifiedAsync(string sessionId, string phoneNumber, CancellationToken cancellationToken = default);

    Task<RegistrationOtpSession> SendIpUnblockOtpAsync(
        string phoneNumber,
        string fullName,
        CancellationToken cancellationToken = default);

    Task<bool> VerifyIpUnblockOtpAsync(string sessionId, string phoneNumber, string otpCode, CancellationToken cancellationToken = default);

    Task<bool> IsIpUnblockVerifiedAsync(string sessionId, string phoneNumber, CancellationToken cancellationToken = default);

    /// <summary>
    /// Sends login 2FA OTP. Prefers SMS when a phone is provided; otherwise uses email.
    /// </summary>
    Task<LoginTwoFactorOtpSession> SendLoginTwoFactorOtpAsync(
        long userId,
        string? phoneLocalNumber,
        string? email,
        string recipientName,
        CancellationToken cancellationToken = default);

    Task<bool> VerifyLoginTwoFactorOtpAsync(
        string sessionId,
        string otpCode,
        CancellationToken cancellationToken = default);

    Task<LoginTwoFactorOtpSession?> GetLoginTwoFactorSessionAsync(
        string sessionId,
        CancellationToken cancellationToken = default);

    Task ConsumeLoginTwoFactorSessionAsync(string sessionId, CancellationToken cancellationToken = default);
}
