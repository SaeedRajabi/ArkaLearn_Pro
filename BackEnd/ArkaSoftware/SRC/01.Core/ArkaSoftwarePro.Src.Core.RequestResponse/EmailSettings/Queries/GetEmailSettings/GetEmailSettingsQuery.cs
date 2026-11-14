using Framework.Src.Core.RequestResponse.Endpoints;
using Framework.Src.Core.RequestResponse.Queries;

namespace ArkaSoftwarePro.Src.Core.RequestResponse.EmailSettings.Queries.GetEmailSettings;

public class GetEmailSettingsQuery : IQuery<EmailSettingsQri>, IWebRequest
{
    public string Path => "/api/Service/EmailSettings/Get";
}

public class EmailSettingsQri
{
    public bool IsEnabled { get; set; }
    public string Host { get; set; } = string.Empty;
    public int Port { get; set; }
    public bool UseSsl { get; set; }
    public bool UseStartTls { get; set; }
    public bool AllowInvalidCertificate { get; set; }
    public string Username { get; set; } = string.Empty;
    public bool HasPassword { get; set; }
    public string FromEmail { get; set; } = string.Empty;
    public string FromName { get; set; } = string.Empty;
    public int TimeoutSeconds { get; set; }
    public bool RequireEmailVerification { get; set; } = true;
    public int OtpExpiryMinutes { get; set; }
    public int OtpResendCooldownSeconds { get; set; }
    public int PasswordResetLinkExpiryMinutes { get; set; } = 15;
    public bool PasswordChangeUseSms { get; set; }
    public bool Configured { get; set; }
}
