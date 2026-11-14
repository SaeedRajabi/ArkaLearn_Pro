using ArkaSoftwarePro.Src.Core.Contracts.SecuritySettings;
using ArkaSoftwarePro.Src.Core.Contracts.SecuritySettings.SecuritySettingsRepositoryContracts.Commands;
using Microsoft.Extensions.DependencyInjection;

namespace ArkaSoftwarePro.Src.Infrastructure.Integrations.Security;

public sealed class SecuritySettingsProvider(IServiceScopeFactory scopeFactory) : ISecuritySettingsProvider
{
    public async Task<SecurityRuntimeSettings> GetCurrentAsync(CancellationToken cancellationToken = default)
    {
        await using var scope = scopeFactory.CreateAsyncScope();
        var repository = scope.ServiceProvider.GetRequiredService<ISecuritySettingsCommandRepository>();
        var row = await repository.GetCurrentAsync();
        if (row is null)
            return new SecurityRuntimeSettings();

        return new SecurityRuntimeSettings
        {
            MaxLoginAttempts = row.MaxLoginAttempts,
            LockoutMinutes = row.LockoutMinutes,
            PermanentBlockAfterLockouts = row.PermanentBlockAfterLockouts,
            IpUnblockOtpExpiryMinutes = row.IpUnblockOtpExpiryMinutes,
            IpUnblockOtpResendCooldownSeconds = row.IpUnblockOtpResendCooldownSeconds,
        };
    }
}
