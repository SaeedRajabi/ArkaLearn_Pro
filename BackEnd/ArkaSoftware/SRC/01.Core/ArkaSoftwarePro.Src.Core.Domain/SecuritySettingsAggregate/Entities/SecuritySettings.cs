using Framework.Src.Core.Domain.Aggregates;

namespace ArkaSoftwarePro.Src.Core.Domain.SecuritySettingsAggregate.Entities;

public class SecuritySettings : AggregateRoot
{
    public int MaxLoginAttempts { get; private set; } = 5;
    public int LockoutMinutes { get; private set; } = 15;
    public int PermanentBlockAfterLockouts { get; private set; } = 2;
    public int IpUnblockOtpExpiryMinutes { get; private set; } = 10;
    public int IpUnblockOtpResendCooldownSeconds { get; private set; } = 120;

    private SecuritySettings()
    {
    }

    public SecuritySettings(
        int maxLoginAttempts,
        int lockoutMinutes,
        int permanentBlockAfterLockouts,
        int ipUnblockOtpExpiryMinutes,
        int ipUnblockOtpResendCooldownSeconds)
    {
        Update(
            maxLoginAttempts,
            lockoutMinutes,
            permanentBlockAfterLockouts,
            ipUnblockOtpExpiryMinutes,
            ipUnblockOtpResendCooldownSeconds);
    }

    public void Update(
        int maxLoginAttempts,
        int lockoutMinutes,
        int permanentBlockAfterLockouts,
        int ipUnblockOtpExpiryMinutes,
        int ipUnblockOtpResendCooldownSeconds)
    {
        MaxLoginAttempts = maxLoginAttempts is < 3 or > 20 ? 5 : maxLoginAttempts;
        LockoutMinutes = lockoutMinutes is < 5 or > 1440 ? 15 : lockoutMinutes;
        PermanentBlockAfterLockouts = permanentBlockAfterLockouts is < 1 or > 10 ? 2 : permanentBlockAfterLockouts;
        IpUnblockOtpExpiryMinutes = ipUnblockOtpExpiryMinutes is < 1 or > 60 ? 10 : ipUnblockOtpExpiryMinutes;
        IpUnblockOtpResendCooldownSeconds = ipUnblockOtpResendCooldownSeconds is < 30 or > 600 ? 120 : ipUnblockOtpResendCooldownSeconds;
    }
}
