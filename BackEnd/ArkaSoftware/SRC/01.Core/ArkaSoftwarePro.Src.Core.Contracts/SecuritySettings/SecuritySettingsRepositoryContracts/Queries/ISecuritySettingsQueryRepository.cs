using Framework.Src.Core.Contracts.Data.Queries;

namespace ArkaSoftwarePro.Src.Core.Contracts.SecuritySettings.SecuritySettingsRepositoryContracts.Queries;

public sealed class SecuritySettingsQri
{
    public int MaxLoginAttempts { get; set; } = 5;
    public int LockoutMinutes { get; set; } = 15;
    public int PermanentBlockAfterLockouts { get; set; } = 2;
    public int IpUnblockOtpExpiryMinutes { get; set; } = 10;
    public int IpUnblockOtpResendCooldownSeconds { get; set; } = 120;
}

public interface ISecuritySettingsQueryRepository : IQueryRepository
{
    Task<SecuritySettingsQri?> GetCurrentAsync();
}
