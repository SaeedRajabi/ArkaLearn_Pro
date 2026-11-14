using ArkaSoftwarePro.Src.Endpoints.API.BackgroundServices;
using ArkaSoftwarePro.Src.Endpoints.API.RealTimes.Rooms;
using ArkaSoftwarePro.Src.Infrastructure.Integrations.Email;
using ArkaSoftwarePro.Src.Infrastructure.Integrations.Rooms;
using ArkaSoftwarePro.Src.Infrastructure.Integrations.Security;
using ArkaSoftwarePro.Src.Infrastructure.Integrations.SupportChat;
using ArkaSoftwarePro.Src.Infrastructure.Integrations.Teachers;
using ArkaSoftwarePro.Src.Core.Contracts.Email;
using ArkaSoftwarePro.Src.Core.Contracts.Services;
using Microsoft.Extensions.Options;

namespace ArkaSoftwarePro.Src.Endpoints.API.Extensions;

public static class EmailServiceRegistration
{
    public static void ConfigureSmtpOptions(IConfiguration configuration, IServiceCollection services)
    {
        services.Configure<SmtpEmailOptions>(configuration.GetSection(SmtpEmailOptions.SectionName));
        services.PostConfigure<SmtpEmailOptions>(options =>
        {
            var envPassword =
                Environment.GetEnvironmentVariable("SMTP_PASSWORD")
                ?? Environment.GetEnvironmentVariable("Smtp__Password");
            if (!string.IsNullOrWhiteSpace(envPassword))
                options.Password = envPassword;

            var envUsername =
                Environment.GetEnvironmentVariable("SMTP_USERNAME")
                ?? Environment.GetEnvironmentVariable("Smtp__Username");
            if (!string.IsNullOrWhiteSpace(envUsername))
                options.Username = envUsername;

            var envFrom =
                Environment.GetEnvironmentVariable("SMTP_FROM_EMAIL")
                ?? Environment.GetEnvironmentVariable("Smtp__FromEmail");
            if (!string.IsNullOrWhiteSpace(envFrom))
                options.FromEmail = envFrom;

            var envHost =
                Environment.GetEnvironmentVariable("SMTP_HOST")
                ?? Environment.GetEnvironmentVariable("Smtp__Host");
            if (!string.IsNullOrWhiteSpace(envHost))
                options.Host = envHost;
        });
    }

    public static void RegisterEmailService(IServiceCollection services)
    {
        services.AddScoped<SmtpConnectionDiagnostics>();
        services.AddScoped<IEmailService>(sp =>
        {
            var provider = sp.GetRequiredService<IEmailSettingsProvider>();
            var options = provider.GetSmtpOptionsAsync().GetAwaiter().GetResult();
            var logger = sp.GetRequiredService<ILogger<SmtpEmailService>>();
            if (options.IsConfigured)
            {
                logger.LogInformation(
                    "Using SMTP email service via {Host}:{Port} as {FromEmail}",
                    options.Host,
                    options.Port,
                    options.FromEmail);
                return new SmtpEmailService(
                    provider,
                    sp.GetRequiredService<IEmailTemplateProvider>(),
                    sp.GetRequiredService<IConfiguration>(),
                    logger);
            }

            var noOpLogger = sp.GetRequiredService<ILogger<NoOpEmailService>>();
            noOpLogger.LogWarning(
                "SMTP is disabled or incomplete (Enabled={Enabled}, Host={Host}, UsernameSet={UsernameSet}, PasswordSet={PasswordSet}, FromEmail={FromEmail}). Falling back to NoOpEmailService.",
                options.Enabled,
                options.Host,
                !string.IsNullOrWhiteSpace(options.Username),
                !string.IsNullOrWhiteSpace(options.Password),
                options.FromEmail);
            return new NoOpEmailService(sp.GetRequiredService<IOptions<SmtpEmailOptions>>(), noOpLogger);
        });
    }
}
