using System.Security.Cryptography;
using System.Text.Json;
using ArkaSoftwarePro.Src.Core.Contracts.Email;
using ArkaSoftwarePro.Src.Core.Contracts.EmailSettings.EmailSettingsRepositoryContracts.Commands;
using ArkaSoftwarePro.Src.Core.Contracts.NotificationSettings;
using ArkaSoftwarePro.Src.Core.Contracts.Sms;
using ArkaSoftwarePro.Src.Core.Contracts.Users.UserRepositoryContracts.Commands;

namespace ArkaSoftwarePro.Src.Core.ApplicationService.EmailServices;

public sealed class PasswordResetService(
    IOtpSessionStore sessionStore,
    IUserCommandRepository userCommandRepository,
    IEmailSettingsCommandRepository emailSettingsRepository,
    INotificationSettingsProvider notificationSettingsProvider,
    ISmsIrClient smsIrClient,
    ITransactionalEmailNotifier emailNotifier,
    IConfiguration configuration,
    ILogger<PasswordResetService> logger) : IPasswordResetService
{
    private static readonly JsonSerializerOptions JsonOptions = new() { PropertyNamingPolicy = JsonNamingPolicy.CamelCase };
    private const int MinPasswordLength = 8;

    public async Task RequestPasswordResetAsync(string email, CancellationToken cancellationToken = default)
    {
        var normalizedEmail = NormalizeEmail(email);
        if (!IsValidEmail(normalizedEmail))
            return;

        var user = userCommandRepository.FindByUserNameAsync(normalizedEmail);
        if (user is null)
            return;

        var settings = await emailSettingsRepository.GetCurrentAsync();
        var expiryMinutes = settings?.PasswordResetLinkExpiryMinutes ?? 15;

        var token = Convert.ToHexString(RandomNumberGenerator.GetBytes(32)).ToLowerInvariant();
        var session = new PasswordResetSession
        {
            UserId = user.Id,
            Email = normalizedEmail,
            ExpiresAtUtc = DateTime.UtcNow.AddMinutes(expiryMinutes)
        };

        await sessionStore.SetAsync(
            BuildTokenKey(token),
            JsonSerializer.Serialize(session, JsonOptions),
            TimeSpan.FromMinutes(expiryMinutes),
            cancellationToken);

        var clientBaseUrl = configuration["PaymentGateway:ClientBaseUrl"]?.Trim().TrimEnd('/')
            ?? "https://arkasoftware.ir";
        var resetLink = $"{clientBaseUrl}/reset-password?token={token}";
        var displayName = user.UserFullName is not null
            ? $"{user.UserFullName.FirstName} {user.UserFullName.LastName}".Trim()
            : user.UserName.Value;

        try
        {
            if (settings?.PasswordChangeUseSms == true && user.PhoneNumber is not null)
            {
                var smsSettings = await notificationSettingsProvider.GetCurrentAsync();
                if (smsSettings is { CanSendSms: true } && smsSettings.LineNumber > 0)
                {
                    var mobile = $"0{user.PhoneNumber.Number}";
                    var smsText =
                        $"آرکا نرم افزار\nلینک بازیابی رمز عبور (تا {expiryMinutes} دقیقه):\n{resetLink}";
                    await smsIrClient.SendBulkAsync(
                        smsSettings.LineNumber,
                        smsText,
                        [mobile],
                        cancellationToken: cancellationToken);
                    return;
                }
            }

            await emailNotifier.SendPasswordResetAsync(
                normalizedEmail,
                string.IsNullOrWhiteSpace(displayName) ? user.UserName.Value : displayName,
                resetLink,
                expiryMinutes,
                cancellationToken);
        }
        catch (Exception ex)
        {
            await sessionStore.RemoveAsync(BuildTokenKey(token), cancellationToken);
            logger.LogError(ex, "Failed to send password reset email to {Email}", normalizedEmail);
            throw;
        }
    }

    public async Task<bool> ResetPasswordAsync(string token, string newPassword, CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(token) || string.IsNullOrWhiteSpace(newPassword))
            return false;
        if (newPassword.Trim().Length < MinPasswordLength)
            return false;

        var key = BuildTokenKey(token.Trim());
        var raw = await sessionStore.GetAsync(key, cancellationToken);
        if (string.IsNullOrWhiteSpace(raw))
            return false;

        PasswordResetSession? session;
        try
        {
            session = JsonSerializer.Deserialize<PasswordResetSession>(raw, JsonOptions);
        }
        catch (JsonException)
        {
            await sessionStore.RemoveAsync(key, cancellationToken);
            return false;
        }

        if (session is null || session.ExpiresAtUtc <= DateTime.UtcNow)
        {
            await sessionStore.RemoveAsync(key, cancellationToken);
            return false;
        }

        var user = await userCommandRepository.GetAsync(session.UserId);
        if (user is null)
        {
            await sessionStore.RemoveAsync(key, cancellationToken);
            return false;
        }

        user.ResetPassword(newPassword.Trim());
        await userCommandRepository.CommitAsync();
        await sessionStore.RemoveAsync(key, cancellationToken);
        return true;
    }

    private static string BuildTokenKey(string token) => $"email:password-reset:{token}";

    private static string NormalizeEmail(string email) => (email ?? string.Empty).Trim().ToLowerInvariant();

    private static bool IsValidEmail(string email)
        => !string.IsNullOrWhiteSpace(email) && email.Contains('@') && email.Contains('.');

    private sealed class PasswordResetSession
    {
        public long UserId { get; set; }
        public string Email { get; set; } = string.Empty;
        public DateTime ExpiresAtUtc { get; set; }
    }
}
