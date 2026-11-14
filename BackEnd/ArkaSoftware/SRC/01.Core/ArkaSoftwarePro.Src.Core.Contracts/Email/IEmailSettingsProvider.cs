namespace ArkaSoftwarePro.Src.Core.Contracts.Email;

public interface IEmailSettingsProvider
{
    Task<EmailSmtpOptions> GetSmtpOptionsAsync(CancellationToken cancellationToken = default);
    Task<EmailRuntimeSettings> GetRuntimeSettingsAsync(CancellationToken cancellationToken = default);
}

public sealed class EmailSmtpOptions
{
    public bool Enabled { get; init; }
    public string Host { get; init; } = string.Empty;
    public int Port { get; init; } = 587;
    public bool UseSsl { get; init; }
    public bool UseStartTls { get; init; } = true;
    public bool AllowInvalidCertificate { get; init; } = true;
    public string Username { get; init; } = string.Empty;
    public string Password { get; init; } = string.Empty;
    public string FromEmail { get; init; } = string.Empty;
    public string FromName { get; init; } = "ArkaSoftware";
    public int TimeoutSeconds { get; init; } = 30;

    public bool IsConfigured =>
        Enabled
        && !string.IsNullOrWhiteSpace(Host)
        && Port > 0
        && !string.IsNullOrWhiteSpace(Username)
        && !string.IsNullOrWhiteSpace(Password)
        && !string.IsNullOrWhiteSpace(FromEmail);
}

public sealed class EmailRuntimeSettings
{
    public bool RequireEmailVerification { get; init; } = true;
    public int OtpExpiryMinutes { get; init; } = 10;
    public int OtpResendCooldownSeconds { get; init; } = 120;
    public int PasswordResetLinkExpiryMinutes { get; init; } = 15;
    public bool PasswordChangeUseSms { get; init; }
}
