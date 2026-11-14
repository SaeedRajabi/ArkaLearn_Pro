using ArkaSoftwarePro.Src.Core.Contracts.CacheSettings.CacheSettingsRepositoryContracts.Queries;
using ArkaSoftwarePro.Src.Core.RequestResponse.CacheSettings.Queries.GetCacheSettings;
using ArkaSoftwarePro.Src.Infrastructure.Data.MSSQL.Queries.Common;
using Framework.Src.Infrastructure.Data.MSSQL.Queries.QueryRepositories;
using Microsoft.EntityFrameworkCore;

namespace ArkaSoftwarePro.Src.Infrastructure.Data.MSSQL.Queries.Repositories;

public class CacheSettingsQueryRepository(ArkaSoftwareQueryDbContext dbContext)
    : BaseQueryRepository<ArkaSoftwareQueryDbContext>(dbContext), ICacheSettingsQueryRepository
{
    public async Task<CacheSettingsQri?> GetCurrentAsync(CancellationToken cancellationToken = default)
    {
        var row = await dbContext.CacheSettings.AsNoTracking()
            .OrderByDescending(x => x.Id)
            .FirstOrDefaultAsync(cancellationToken);
        if (row is null)
            return null;

        return new CacheSettingsQri
        {
            IsEnabled = row.IsEnabled,
            Provider = row.Provider,
            DefaultTtlMinutes = row.DefaultTtlMinutes,
            RedisHost = row.RedisHost,
            RedisPort = row.RedisPort,
            HasRedisPassword = !string.IsNullOrWhiteSpace(row.RedisPasswordEncrypted),
            RedisInstanceName = row.RedisInstanceName,
            RedisUseSsl = row.RedisUseSsl,
            CacheCoursesEnabled = row.CacheCoursesEnabled,
            CacheArticlesEnabled = row.CacheArticlesEnabled,
            CacheSeminarsEnabled = row.CacheSeminarsEnabled,
            CacheBooksEnabled = row.CacheBooksEnabled,
            CacheSoftwareEnabled = row.CacheSoftwareEnabled,
            CacheTeacherAdsEnabled = row.CacheTeacherAdsEnabled,
            CacheFilesEnabled = row.CacheFilesEnabled,
            CacheCategoriesEnabled = row.CacheCategoriesEnabled,
            CacheTeachersEnabled = row.CacheTeachersEnabled,
            CacheProjectsEnabled = row.CacheProjectsEnabled,
        };
    }
}
