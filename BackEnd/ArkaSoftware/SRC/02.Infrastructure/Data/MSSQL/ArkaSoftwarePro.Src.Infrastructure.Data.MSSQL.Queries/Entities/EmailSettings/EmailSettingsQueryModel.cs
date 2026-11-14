namespace ArkaSoftwarePro.Src.Infrastructure.Data.MSSQL.Queries.Entities.EmailSettings;

public class EmailSettingsQueryModel
{
    public long Id { get; set; }
    public bool IsEnabled { get; set; }
    public string Host { get; set; } = string.Empty;
    public int Port { get; set; }
    public bool UseSsl { get; set; }
    public bool UseStartTls { get; set; }
    public bool AllowInvalidCertificate { get; set; }
    public string Username { get; set; } = string.Empty;
    public string Password { get; set; } = string.Empty;
    public string FromEmail { get; set; } = string.Empty;
    public string FromName { get; set; } = string.Empty;
    public int TimeoutSeconds { get; set; }
    public bool RequireEmailVerification { get; set; } = true;
    public int OtpExpiryMinutes { get; set; }
    public int OtpResendCooldownSeconds { get; set; }
    public int PasswordResetLinkExpiryMinutes { get; set; } = 15;
    public bool PasswordChangeUseSms { get; set; }
}
