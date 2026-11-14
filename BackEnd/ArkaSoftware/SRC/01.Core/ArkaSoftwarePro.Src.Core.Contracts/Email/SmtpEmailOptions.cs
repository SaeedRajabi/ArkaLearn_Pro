namespace ArkaSoftwarePro.Src.Core.Contracts.Email;

public sealed class SmtpEmailOptions
{
    public const string SectionName = "Smtp";

    public bool Enabled { get; set; }

    public string Host { get; set; } = "smtp.gmail.com";

    public int Port { get; set; } = 587;

    /// <summary>When true, connects with SSL on connect (typical for port 465).</summary>
    public bool UseSsl { get; set; }

    /// <summary>When true, upgrades the connection with STARTTLS (typical for port 587).</summary>
    public bool UseStartTls { get; set; } = true;

    public string Username { get; set; } = string.Empty;

    public string Password { get; set; } = string.Empty;

    public string FromEmail { get; set; } = string.Empty;

    public string FromName { get; set; } = "ArkaSoftware";

    /// <summary>When true, TLS certificate validation is relaxed (some Plesk/shared hosts use self-signed certs).</summary>
    public bool AllowInvalidCertificate { get; set; } = false;

    public int TimeoutSeconds { get; set; } = 30;

    public bool IsConfigured =>
        Enabled
        && !string.IsNullOrWhiteSpace(Host)
        && Port > 0
        && !string.IsNullOrWhiteSpace(Username)
        && !string.IsNullOrWhiteSpace(Password)
        && !string.IsNullOrWhiteSpace(FromEmail);
}
