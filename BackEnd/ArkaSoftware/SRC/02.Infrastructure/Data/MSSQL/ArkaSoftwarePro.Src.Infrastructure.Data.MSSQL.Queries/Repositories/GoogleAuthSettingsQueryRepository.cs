using ArkaSoftwarePro.Src.Core.Contracts.GoogleAuthSettings.GoogleAuthSettingsRepositoryContracts.Queries;
using ArkaSoftwarePro.Src.Infrastructure.Data.MSSQL.Queries.Common;
using Framework.Src.Infrastructure.Data.MSSQL.Queries.QueryRepositories;
using Microsoft.EntityFrameworkCore;

namespace ArkaSoftwarePro.Src.Infrastructure.Data.MSSQL.Queries.Repositories;

public class GoogleAuthSettingsQueryRepository(ArkaSoftwareQueryDbContext dbContext)
    : BaseQueryRepository<ArkaSoftwareQueryDbContext>(dbContext), IGoogleAuthSettingsQueryRepository
{
    public async Task<GoogleAuthSettingsQri?> GetCurrentAsync()
    {
        var row = await dbContext.GoogleAuthSettings.AsNoTracking()
            .OrderByDescending(x => x.Id)
            .FirstOrDefaultAsync();
        if (row is null) return null;

        return new GoogleAuthSettingsQri
        {
            IsEnabled = row.IsEnabled,
            ClientId = row.ClientId,
            HasClientSecret = !string.IsNullOrWhiteSpace(row.ClientSecret)
        };
    }
}
