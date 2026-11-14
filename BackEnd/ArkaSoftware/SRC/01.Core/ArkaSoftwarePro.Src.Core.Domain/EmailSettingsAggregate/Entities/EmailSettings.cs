using Framework.Src.Core.Domain.Aggregates;

namespace ArkaSoftwarePro.Src.Core.Domain.EmailSettingsAggregate.Entities;

public class EmailSettings : AggregateRoot
{
    public bool IsEnabled { get; private set; }
    public string Host { get; private set; } = string.Empty;
    public int Port { get; private set; } = 587;
    public bool UseSsl { get; private set; }
    public bool UseStartTls { get; private set; } = true;
    public bool AllowInvalidCertificate { get; private set; } = true;
    public string Username { get; private set; } = string.Empty;
    public string Password { get; private set; } = string.Empty;
    public string FromEmail { get; private set; } = string.Empty;
    public string FromName { get; private set; } = "ArkaSoftware";
    public int TimeoutSeconds { get; private set; } = 30;
    public bool RequireEmailVerification { get; private set; } = true;
    public int OtpExpiryMinutes { get; private set; } = 10;
    public int OtpResendCooldownSeconds { get; private set; } = 120;
    public int PasswordResetLinkExpiryMinutes { get; private set; } = 15;
    public bool PasswordChangeUseSms { get; private set; }

    private EmailSettings()
    {
    }

    public EmailSettings(
        bool isEnabled,
        string host,
        int port,
        bool useSsl,
        bool useStartTls,
        bool allowInvalidCertificate,
        string username,
        string password,
        string fromEmail,
        string fromName,
        int timeoutSeconds,
        bool requireEmailVerification,
        int otpExpiryMinutes,
        int otpResendCooldownSeconds,
        int passwordResetLinkExpiryMinutes = 15,
        bool passwordChangeUseSms = false)
    {
        Update(
            isEnabled,
            host,
            port,
            useSsl,
            useStartTls,
            allowInvalidCertificate,
            username,
            password,
            fromEmail,
            fromName,
            timeoutSeconds,
            requireEmailVerification,
            otpExpiryMinutes,
            otpResendCooldownSeconds,
            passwordResetLinkExpiryMinutes,
            passwordChangeUseSms);
    }

    public void Update(
        bool isEnabled,
        string host,
        int port,
        bool useSsl,
        bool useStartTls,
        bool allowInvalidCertificate,
        string username,
        string password,
        string fromEmail,
        string fromName,
        int timeoutSeconds,
        bool requireEmailVerification,
        int otpExpiryMinutes,
        int otpResendCooldownSeconds,
        int passwordResetLinkExpiryMinutes,
        bool passwordChangeUseSms)
    {
        IsEnabled = isEnabled;
        Host = host?.Trim() ?? string.Empty;
        Port = port is < 1 or > 65535 ? 587 : port;
        UseSsl = useSsl;
        UseStartTls = useStartTls;
        AllowInvalidCertificate = allowInvalidCertificate;
        Username = username?.Trim() ?? string.Empty;
        Password = password ?? string.Empty;
        FromEmail = fromEmail?.Trim() ?? string.Empty;
        FromName = string.IsNullOrWhiteSpace(fromName) ? "ArkaSoftware" : fromName.Trim();
        TimeoutSeconds = timeoutSeconds is < 5 or > 300 ? 30 : timeoutSeconds;
        RequireEmailVerification = requireEmailVerification;
        OtpExpiryMinutes = otpExpiryMinutes is < 1 or > 60 ? 10 : otpExpiryMinutes;
        OtpResendCooldownSeconds = otpResendCooldownSeconds is < 30 or > 600 ? 120 : otpResendCooldownSeconds;
        PasswordResetLinkExpiryMinutes = passwordResetLinkExpiryMinutes is < 5 or > 120 ? 15 : passwordResetLinkExpiryMinutes;
        PasswordChangeUseSms = passwordChangeUseSms;
    }

    public bool IsConfigured =>
        IsEnabled
        && !string.IsNullOrWhiteSpace(Host)
        && Port > 0
        && !string.IsNullOrWhiteSpace(Username)
        && !string.IsNullOrWhiteSpace(Password)
        && !string.IsNullOrWhiteSpace(FromEmail);
}
