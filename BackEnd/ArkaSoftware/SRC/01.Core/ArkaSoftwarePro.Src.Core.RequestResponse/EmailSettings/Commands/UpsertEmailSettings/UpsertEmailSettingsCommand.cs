using Framework.Src.Core.RequestResponse.Commands;
using Framework.Src.Core.RequestResponse.Endpoints;

namespace ArkaSoftwarePro.Src.Core.RequestResponse.EmailSettings.Commands.UpsertEmailSettings;

public class UpsertEmailSettingsCommand : ICommand<string>, IWebRequest
{
    public bool IsEnabled { get; set; }
    public string Host { get; set; } = string.Empty;
    public int Port { get; set; } = 587;
    public bool UseSsl { get; set; }
    public bool UseStartTls { get; set; } = true;
    public bool AllowInvalidCertificate { get; set; } = true;
    public string? Username { get; set; }
    public string? Password { get; set; }
    public string FromEmail { get; set; } = string.Empty;
    public string FromName { get; set; } = "ArkaSoftware";
    public int TimeoutSeconds { get; set; } = 30;
    public bool RequireEmailVerification { get; set; } = true;
    public int OtpExpiryMinutes { get; set; } = 10;
    public int OtpResendCooldownSeconds { get; set; } = 120;
    public int PasswordResetLinkExpiryMinutes { get; set; } = 15;
    public bool PasswordChangeUseSms { get; set; }
    public string Path => "/api/Service/EmailSettings/Upsert";
}
