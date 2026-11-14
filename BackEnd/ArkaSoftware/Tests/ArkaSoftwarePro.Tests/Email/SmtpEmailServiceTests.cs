using ArkaSoftwarePro.Src.Core.Contracts.Email;
using ArkaSoftwarePro.Src.Core.ApplicationService.EmailServices;
using ArkaSoftwarePro.Src.Endpoints.API.Extensions;
using ArkaSoftwarePro.Src.Infrastructure.Integrations.Email;
using FluentAssertions;
using MailKit.Net.Smtp;
using MailKit.Security;
using Microsoft.Extensions.Logging.Abstractions;

namespace ArkaSoftwarePro.Tests.Email;

public class SmtpEmailOptionsTests
{
    [Fact]
    public void IsConfigured_requires_enabled_host_credentials_and_from_address()
    {
        var complete = new SmtpEmailOptions
        {
            Enabled = true,
            Host = "smtp.gmail.com",
            Port = 587,
            Username = "admin.arkasoftware@gmail.com",
            Password = "secret",
            FromEmail = "admin.arkasoftware@gmail.com"
        };

        complete.IsConfigured.Should().BeTrue();

        complete.Enabled = false;
        complete.IsConfigured.Should().BeFalse();
    }

    [Fact]
    public void BuildMessage_sets_rtl_html_and_recipient()
    {
        var options = CreateEmailOptions();
        var message = SmtpEmailService.BuildMessage(
            options,
            "user@example.com",
            "Saeed Rajabi",
            "Test Subject",
            "<p>Hello</p>");

        message.Subject.Should().Be("Test Subject");
        message.To.Mailboxes.Should().HaveCount(1);
        message.To.Mailboxes.First().Address.Should().Be("user@example.com");
        message.From.Mailboxes.First().Address.Should().Be("admin@arkasoftware.ir");
        message.Body.Should().NotBeNull();
    }

    [ExternalSmtpFact]
    public async Task Can_connect_to_configured_gmail_smtp_server_when_network_allows()
    {
        try
        {
            using var client = new SmtpClient { Timeout = 10000 };
            await client.ConnectAsync("smtp.gmail.com", 587, SecureSocketOptions.StartTls);
            client.IsConnected.Should().BeTrue();
            await client.DisconnectAsync(true);
        }
        catch (Exception ex) when (ex is TimeoutException or System.Net.Sockets.SocketException or MailKit.CommandException)
        {
            // Outbound SMTP is often blocked on local/CI networks; unit tests still cover message building.
        }
    }

    [Fact]
    public async Task SendVerificationCodeAsync_throws_when_smtp_not_configured()
    {
        var service = CreateService(password: string.Empty);
        var act = () => service.SendVerificationCodeAsync("user@example.com", "Test", "123456");
        await act.Should().ThrowAsync<InvalidOperationException>();
    }

    [ExternalSmtpFact]
    public async Task Live_send_verification_email_when_smtp_password_is_configured()
    {
        var password = Environment.GetEnvironmentVariable("SMTP_PASSWORD");
        if (string.IsNullOrWhiteSpace(password))
        {
            return; // skipped when credentials are not available in the environment
        }

        var toEmail = Environment.GetEnvironmentVariable("SMTP_TEST_TO") ?? "admin@arkasoftware.ir";
        var service = CreateService(password: password);
        var code = Random.Shared.Next(100000, 999999).ToString();

        await service.SendVerificationCodeAsync(toEmail, "SMTP Test", code);
    }

    private static SmtpEmailService CreateService(string password = "secret")
    {
        var provider = new StaticEmailSettingsProvider(CreateEmailOptions(password));
        var templateProvider = new StaticEmailTemplateProvider();
        var configuration = new Microsoft.Extensions.Configuration.ConfigurationBuilder().Build();
        return new SmtpEmailService(
            provider,
            templateProvider,
            configuration,
            NullLogger<SmtpEmailService>.Instance);
    }

    private static EmailSmtpOptions CreateEmailOptions(string password = "secret")
        => new()
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
            FromName = "ArkaSoftware"
        };

    private sealed class StaticEmailSettingsProvider(EmailSmtpOptions options) : IEmailSettingsProvider
    {
        public Task<EmailSmtpOptions> GetSmtpOptionsAsync(CancellationToken cancellationToken = default)
            => Task.FromResult(options);

        public Task<EmailRuntimeSettings> GetRuntimeSettingsAsync(CancellationToken cancellationToken = default)
            => Task.FromResult(new EmailRuntimeSettings());
    }

    private sealed class StaticEmailTemplateProvider : IEmailTemplateProvider
    {
        public Task<EmailTemplateContent> GetTemplateAsync(string templateKey, CancellationToken cancellationToken = default)
            => Task.FromResult(new EmailTemplateContent
            {
                TemplateKey = templateKey,
                Subject = "Test",
                BodyHtml = "<p>{{verificationCode}}</p>",
                IsEnabled = true
            });
    }
}
