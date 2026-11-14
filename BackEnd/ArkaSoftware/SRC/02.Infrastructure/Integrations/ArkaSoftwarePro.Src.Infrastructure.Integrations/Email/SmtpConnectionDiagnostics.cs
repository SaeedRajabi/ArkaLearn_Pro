using ArkaSoftwarePro.Src.Core.Contracts.Email;
using MailKit.Net.Smtp;
using MailKit.Security;
using Microsoft.Extensions.Logging.Abstractions;
using Microsoft.Extensions.Options;

namespace ArkaSoftwarePro.Src.Infrastructure.Integrations.Email;

public sealed class SmtpConnectionDiagnostics(
    IOptions<SmtpEmailOptions> optionsAccessor,
    ILogger<SmtpConnectionDiagnostics> logger)
{
    public async Task<SmtpDiagnosticResult> RunAsync(
        string? testRecipient = null,
        CancellationToken cancellationToken = default)
    {
        var options = optionsAccessor.Value;
        var result = new SmtpDiagnosticResult
        {
            Host = options.Host,
            Port = options.Port,
            Username = options.Username,
            FromEmail = options.FromEmail,
            Enabled = options.Enabled,
            Configured = options.IsConfigured,
            UseSsl = options.UseSsl,
            UseStartTls = options.UseStartTls
        };

        if (!options.IsConfigured)
        {
            result.Success = false;
            result.Stage = "configuration";
            result.Message = "SMTP is enabled but incomplete. Check Host, Port, Username, Password, and FromEmail.";
            return result;
        }

        using var client = new SmtpClient
        {
            Timeout = options.TimeoutSeconds * 1000,
            CheckCertificateRevocation = false
        };

        if (options.AllowInvalidCertificate)
        {
            client.ServerCertificateValidationCallback = (_, _, _, _) => true;
        }

        try
        {
            var secure = options.UseSsl
                ? SecureSocketOptions.SslOnConnect
                : options.UseStartTls
                    ? SecureSocketOptions.StartTls
                    : SecureSocketOptions.Auto;

            result.Stage = "connect";
            await client.ConnectAsync(options.Host, options.Port, secure, cancellationToken);
            result.Connected = true;
            result.ServerCapabilities = client.Capabilities.ToString();

            result.Stage = "authenticate";
            await client.AuthenticateAsync(options.Username, options.Password, cancellationToken);
            result.Authenticated = true;

            if (!string.IsNullOrWhiteSpace(testRecipient))
            {
                result.Stage = "send-test";
                var probe = new MimeKit.MimeMessage();
                probe.From.Add(new MimeKit.MailboxAddress(options.FromName, options.FromEmail));
                probe.To.Add(MimeKit.MailboxAddress.Parse(testRecipient.Trim()));
                probe.Subject = "ArkaSoftware SMTP diagnostic";
                probe.Body = new MimeKit.TextPart("plain")
                {
                    Text = $"SMTP diagnostic probe at {DateTime.UtcNow:O}"
                };
                await client.SendAsync(probe, cancellationToken);
                result.TestEmailSent = true;
                result.TestRecipient = testRecipient.Trim();
            }

            await client.DisconnectAsync(true, cancellationToken);
            result.Success = true;
            result.Message = result.TestEmailSent
                ? "Connected, authenticated, and test email accepted by SMTP server."
                : "Connected and authenticated successfully.";
        }
        catch (Exception ex)
        {
            result.Success = false;
            result.Message = DescribeSmtpException(ex);
            logger.LogWarning(ex, "SMTP diagnostic failed at stage {Stage} for {Host}:{Port}", result.Stage, options.Host, options.Port);
        }

        return result;
    }

    public static string DescribeSmtpException(Exception ex)
    {
        var baseMessage = ex.Message;
        if (ex is AuthenticationException)
            return $"SMTP authentication failed. Verify mailbox password and that Host matches your hosting panel (Plesk: mail.yourdomain.com). Details: {baseMessage}";
        if (ex is SmtpCommandException smtpEx)
            return $"SMTP rejected the message ({smtpEx.StatusCode}). Details: {baseMessage}";
        if (ex is SmtpProtocolException)
            return $"SMTP protocol error. Check Port/SSL settings (Plesk: 465+SSL or 587+STARTTLS). Details: {baseMessage}";
        if (ex is System.Security.Authentication.AuthenticationException)
            return $"TLS/SSL handshake failed. Try Port 465 with UseSsl=true, or Port 587 with UseStartTls=true. Details: {baseMessage}";
        return baseMessage;
    }
}

public sealed class SmtpDiagnosticResult
{
    public bool Success { get; set; }
    public bool Enabled { get; set; }
    public bool Configured { get; set; }
    public bool Connected { get; set; }
    public bool Authenticated { get; set; }
    public bool TestEmailSent { get; set; }
    public string Stage { get; set; } = string.Empty;
    public string Message { get; set; } = string.Empty;
    public string Host { get; set; } = string.Empty;
    public int Port { get; set; }
    public string Username { get; set; } = string.Empty;
    public string FromEmail { get; set; } = string.Empty;
    public bool UseSsl { get; set; }
    public bool UseStartTls { get; set; }
    public string? ServerCapabilities { get; set; }
    public string? TestRecipient { get; set; }
}
