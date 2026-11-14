namespace ArkaSoftwarePro.Src.Infrastructure.Data.MSSQL.Queries.Entities.SecuritySettings;

public class SecuritySettingsQueryModel
{
    public long Id { get; set; }
    public int MaxLoginAttempts { get; set; } = 5;
    public int LockoutMinutes { get; set; } = 15;
    public int PermanentBlockAfterLockouts { get; set; } = 2;
    public int IpUnblockOtpExpiryMinutes { get; set; } = 10;
    public int IpUnblockOtpResendCooldownSeconds { get; set; } = 120;
}
