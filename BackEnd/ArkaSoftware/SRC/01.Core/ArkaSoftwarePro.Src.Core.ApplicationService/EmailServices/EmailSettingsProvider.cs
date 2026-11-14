using ArkaSoftwarePro.Src.Core.Contracts.Email;
using ArkaSoftwarePro.Src.Core.Contracts.EmailSettings.EmailSettingsRepositoryContracts.Commands;
using ArkaSoftwarePro.Src.Core.Contracts.NotificationSettings;
using Microsoft.Extensions.Options;
using ArkaSoftwarePro.Src.Core.ApplicationService.EmailServices;

namespace ArkaSoftwarePro.Src.Core.ApplicationService.EmailServices;

public sealed class EmailSettingsProvider(
    IEmailSettingsCommandRepository repository,
    INotificationSettingsProvider notificationSettingsProvider,
    IOptions<SmtpEmailOptions> fallbackOptions, IHostEnvironment environment) : IEmailSettingsProvider
{
    public async Task<EmailSmtpOptions> GetSmtpOptionsAsync(CancellationToken cancellationToken = default)
    {
        var db = await repository.GetCurrentAsync();
        var fallback = fallbackOptions.Value;

        if (db is null || !db.IsEnabled)
            return MapFromFallback(fallback, enabled: fallback.Enabled);

        return new EmailSmtpOptions
        {
            Enabled = db.IsEnabled,
            Host = Prefer(db.Host, fallback.Host),
            Port = db.Port > 0 ? db.Port : fallback.Port,
            UseSsl = db.UseSsl,
            UseStartTls = db.UseStartTls,
            AllowInvalidCertificate = environment.IsDevelopment() && db.AllowInvalidCertificate,
            Username = Prefer(db.Username, fallback.Username),
            Password = Prefer(db.Password, fallback.Password),
            FromEmail = Prefer(db.FromEmail, fallback.FromEmail),
            FromName = Prefer(db.FromName, fallback.FromName),
            TimeoutSeconds = db.TimeoutSeconds > 0 ? db.TimeoutSeconds : fallback.TimeoutSeconds
        };
    }

    public async Task<EmailRuntimeSettings> GetRuntimeSettingsAsync(CancellationToken cancellationToken = default)
    {
        var db = await repository.GetCurrentAsync();
        var notification = await notificationSettingsProvider.GetCurrentAsync(cancellationToken);

        return new EmailRuntimeSettings
        {
            RequireEmailVerification = db?.RequireEmailVerification ?? true,
            OtpExpiryMinutes = db?.OtpExpiryMinutes ?? notification?.OtpExpiryMinutes ?? 10,
            OtpResendCooldownSeconds = db?.OtpResendCooldownSeconds ?? notification?.OtpResendCooldownSeconds ?? 120,
            PasswordResetLinkExpiryMinutes = db?.PasswordResetLinkExpiryMinutes ?? 15,
            PasswordChangeUseSms = db?.PasswordChangeUseSms ?? false
        };
    }

    private EmailSmtpOptions MapFromFallback(SmtpEmailOptions fallback, bool enabled)
        => new()
        {
            Enabled = enabled,
            Host = fallback.Host,
            Port = fallback.Port,
            UseSsl = fallback.UseSsl,
            UseStartTls = fallback.UseStartTls,
            AllowInvalidCertificate = environment.IsDevelopment() && fallback.AllowInvalidCertificate,
            Username = fallback.Username,
            Password = fallback.Password,
            FromEmail = fallback.FromEmail,
            FromName = fallback.FromName,
            TimeoutSeconds = fallback.TimeoutSeconds
        };

    private static string Prefer(string primary, string fallback)
        => string.IsNullOrWhiteSpace(primary) ? fallback : primary.Trim();
}
