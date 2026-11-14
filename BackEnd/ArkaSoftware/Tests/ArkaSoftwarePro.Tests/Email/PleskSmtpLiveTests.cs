using ArkaSoftwarePro.Src.Core.ApplicationService.EmailServices;
using ArkaSoftwarePro.Src.Core.Contracts.Email;
using ArkaSoftwarePro.Src.Endpoints.API.Extensions;
using ArkaSoftwarePro.Src.Infrastructure.Integrations.Email;
using FluentAssertions;
using MailKit.Net.Smtp;
using MailKit.Security;
using Microsoft.Extensions.Logging.Abstractions;
using Microsoft.Extensions.Options;

namespace ArkaSoftwarePro.Tests.Email;

public class PleskSmtpLiveTests
{
    [ExternalSmtpFact]
    public async Task Plesk_mail_server_accepts_authentication_on_port_465()
    {
        var password = Environment.GetEnvironmentVariable("SMTP_PASSWORD");
        if (string.IsNullOrWhiteSpace(password))
            return; // Set SMTP_PASSWORD to run live Plesk verification against production mailbox.

        var options = Options.Create(new SmtpEmailOptions
        {
            Enabled = true,
            Host = "mail.arkasoftware.ir",
            Port = 465,
            UseSsl = true,
            UseStartTls = false,
            AllowInvalidCertificate = true,
            Username = "admin@arkasoftware.ir",
            Password = password,
            FromEmail = "admin@arkasoftware.ir",
            FromName = "ArkaSoftware",
            TimeoutSeconds = 30
        });

        var diagnostics = new SmtpConnectionDiagnostics(options, NullLogger<SmtpConnectionDiagnostics>.Instance);
        var result = await diagnostics.RunAsync("admin@arkasoftware.ir");

        result.Success.Should().BeTrue(result.Message);
        result.Authenticated.Should().BeTrue();
        result.TestEmailSent.Should().BeTrue();
    }

    [ExternalSmtpFact]
    public async Task Wrong_gmail_host_fails_for_plesk_mailbox()
    {
        var password = Environment.GetEnvironmentVariable("SMTP_PASSWORD");
        if (string.IsNullOrWhiteSpace(password))
            return; // Set SMTP_PASSWORD to run live Plesk verification against production mailbox.

        using var client = new SmtpClient
        {
            Timeout = 20000,
            CheckCertificateRevocation = false,
            ServerCertificateValidationCallback = (_, _, _, _) => true
        };

        await client.ConnectAsync("smtp.gmail.com", 587, SecureSocketOptions.StartTls);

        var act = async () => await client.AuthenticateAsync("admin@arkasoftware.ir", password);
        await act.Should().ThrowAsync<Exception>();
        await client.DisconnectAsync(true);
    }
}
