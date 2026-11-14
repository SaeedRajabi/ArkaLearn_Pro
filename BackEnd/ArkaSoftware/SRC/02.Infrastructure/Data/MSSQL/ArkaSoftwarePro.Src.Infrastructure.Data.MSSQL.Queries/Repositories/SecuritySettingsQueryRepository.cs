using ArkaSoftwarePro.Src.Core.Contracts.SecuritySettings.SecuritySettingsRepositoryContracts.Queries;
using ArkaSoftwarePro.Src.Infrastructure.Data.MSSQL.Queries.Common;
using Framework.Src.Infrastructure.Data.MSSQL.Queries.QueryRepositories;
using Microsoft.EntityFrameworkCore;

namespace ArkaSoftwarePro.Src.Infrastructure.Data.MSSQL.Queries.Repositories;

public class SecuritySettingsQueryRepository(ArkaSoftwareQueryDbContext dbContext)
    : BaseQueryRepository<ArkaSoftwareQueryDbContext>(dbContext), ISecuritySettingsQueryRepository
{
    public async Task<SecuritySettingsQri?> GetCurrentAsync()
    {
        var row = await dbContext.SecuritySettings.AsNoTracking()
            .OrderByDescending(x => x.Id)
            .FirstOrDefaultAsync();
        if (row is null) return null;

        return new SecuritySettingsQri
        {
            MaxLoginAttempts = row.MaxLoginAttempts,
            LockoutMinutes = row.LockoutMinutes,
            PermanentBlockAfterLockouts = row.PermanentBlockAfterLockouts,
            IpUnblockOtpExpiryMinutes = row.IpUnblockOtpExpiryMinutes,
            IpUnblockOtpResendCooldownSeconds = row.IpUnblockOtpResendCooldownSeconds,
        };
    }
}
