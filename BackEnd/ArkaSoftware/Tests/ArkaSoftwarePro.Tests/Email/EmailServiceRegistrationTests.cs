using ArkaSoftwarePro.Src.Core.Contracts.Email;
using ArkaSoftwarePro.Src.Core.Contracts.Services;
using ArkaSoftwarePro.Src.Endpoints.API.BackgroundServices;
using ArkaSoftwarePro.Src.Endpoints.API.RealTimes.Rooms;
using ArkaSoftwarePro.Src.Infrastructure.Integrations.Email;
using ArkaSoftwarePro.Src.Infrastructure.Integrations.Rooms;
using ArkaSoftwarePro.Src.Infrastructure.Integrations.Security;
using ArkaSoftwarePro.Src.Infrastructure.Integrations.SupportChat;
using ArkaSoftwarePro.Src.Infrastructure.Integrations.Teachers;
using ArkaSoftwarePro.Src.Core.ApplicationService.EmailServices;
using ArkaSoftwarePro.Src.Endpoints.API.Extensions;
using FluentAssertions;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Options;
using Microsoft.Extensions.Configuration;
using Moq;

namespace ArkaSoftwarePro.Tests.Email;

public class EmailServiceRegistrationTests
{
    [Fact]
    public void RegisterEmailService_uses_smtp_when_fully_configured()
    {
        var services = new ServiceCollection();
        services.AddLogging();
        services.AddSingleton<IConfiguration>(new ConfigurationBuilder().Build());
        services.AddScoped(_ => Mock.Of<IEmailTemplateProvider>());
        services.Configure<SmtpEmailOptions>(opts =>
        {
            opts.Enabled = true;
            opts.Host = "mail.arkasoftware.ir";
            opts.Port = 465;
            opts.UseSsl = true;
            opts.Username = "admin@arkasoftware.ir";
            opts.Password = "secret";
            opts.FromEmail = "admin@arkasoftware.ir";
        });
        services.AddScoped<IEmailSettingsProvider>(_ => new StaticEmailSettingsProvider(new EmailSmtpOptions
        {
            Enabled = true,
            Host = "mail.arkasoftware.ir",
            Port = 465,
            UseSsl = true,
            Username = "admin@arkasoftware.ir",
            Password = "secret",
            FromEmail = "admin@arkasoftware.ir"
        }));
        EmailServiceRegistration.RegisterEmailService(services);

        using var provider = services.BuildServiceProvider();
        provider.GetRequiredService<IEmailService>().Should().BeOfType<SmtpEmailService>();
    }

    [Fact]
    public void RegisterEmailService_falls_back_to_noop_when_password_missing()
    {
        var services = new ServiceCollection();
        services.AddLogging();
        services.AddSingleton<IConfiguration>(new ConfigurationBuilder().Build());
        services.AddScoped(_ => Mock.Of<IEmailTemplateProvider>());
        services.Configure<SmtpEmailOptions>(opts =>
        {
            opts.Enabled = true;
            opts.Host = "mail.arkasoftware.ir";
            opts.Port = 465;
            opts.Username = "admin@arkasoftware.ir";
            opts.Password = "";
            opts.FromEmail = "admin@arkasoftware.ir";
        });
        services.AddScoped<IEmailSettingsProvider>(_ => new StaticEmailSettingsProvider(new EmailSmtpOptions
        {
            Enabled = true,
            Host = "mail.arkasoftware.ir",
            Port = 465,
            Username = "admin@arkasoftware.ir",
            Password = "",
            FromEmail = "admin@arkasoftware.ir"
        }));
        EmailServiceRegistration.RegisterEmailService(services);

        using var provider = services.BuildServiceProvider();
        provider.GetRequiredService<IEmailService>().Should().BeOfType<NoOpEmailService>();
    }

    [Fact]
    public async Task NoOp_throws_when_smtp_enabled_but_not_configured()
    {
        var service = new NoOpEmailService(Options.Create(new SmtpEmailOptions { Enabled = true }));
        var act = () => service.SendVerificationCodeAsync("user@example.com", "Test", "123456");
        await act.Should().ThrowAsync<InvalidOperationException>();
    }

    private sealed class StaticEmailSettingsProvider(EmailSmtpOptions options) : IEmailSettingsProvider
    {
        public Task<EmailSmtpOptions> GetSmtpOptionsAsync(CancellationToken cancellationToken = default)
            => Task.FromResult(options);

        public Task<EmailRuntimeSettings> GetRuntimeSettingsAsync(CancellationToken cancellationToken = default)
            => Task.FromResult(new EmailRuntimeSettings());
    }
}
