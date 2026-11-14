namespace ArkaSoftwarePro.Src.Core.Contracts.SecuritySettings;

public sealed class SecurityRuntimeSettings
{
    public int MaxLoginAttempts { get; init; } = 5;
    public int LockoutMinutes { get; init; } = 15;
    public int PermanentBlockAfterLockouts { get; init; } = 2;
    public int IpUnblockOtpExpiryMinutes { get; init; } = 10;
    public int IpUnblockOtpResendCooldownSeconds { get; init; } = 120;
}

public interface ISecuritySettingsProvider
{
    Task<SecurityRuntimeSettings> GetCurrentAsync(CancellationToken cancellationToken = default);
}
