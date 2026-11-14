using ArkaSoftwarePro.Src.Core.Contracts.CacheSettings.CacheSettingsRepositoryContracts.Commands;
using ArkaSoftwarePro.Src.Core.Contracts.Caching;
using ArkaSoftwarePro.Src.Core.Contracts.Security;
using ArkaSoftwarePro.Src.Core.Domain.CacheSettingsAggregate.Entities;
using Microsoft.Extensions.Configuration;

namespace ArkaSoftwarePro.Src.Core.ApplicationService.CacheSettingsServices;

public sealed class CacheSettingsLoader(
    ICacheSettingsCommandRepository repository,
    ISecretProtector secretProtector,
    IConfiguration configuration)
{
    public async Task<CacheSettingsSnapshot> LoadAsync(CancellationToken cancellationToken = default)
    {
        var row = await repository.GetCurrentAsync(cancellationToken);
        if (row is null)
        {
            var section = configuration.GetSection("DistributedRedisCacheOptions");
            return new CacheSettingsSnapshot
            {
                IsEnabled = false,
                Provider = CacheProviderType.InMemory,
                DefaultTtlMinutes = 30,
                RedisHost = ParseHost(section.GetValue<string>("Configuration") ?? "127.0.0.1:6379"),
                RedisPort = ParsePort(section.GetValue<string>("Configuration") ?? "127.0.0.1:6379"),
                RedisInstanceName = section.GetValue<string>("InstanceName") ?? "ArkaLearn:",
            };
        }

        return new CacheSettingsSnapshot
        {
            IsEnabled = row.IsEnabled,
            Provider = row.Provider,
            DefaultTtlMinutes = row.DefaultTtlMinutes,
            RedisHost = row.RedisHost,
            RedisPort = row.RedisPort,
            RedisPassword = secretProtector.Unprotect(row.RedisPasswordEncrypted),
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

    private static string ParseHost(string value)
    {
        var parts = value.Split(':', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries);
        return parts.Length > 0 ? parts[0] : "127.0.0.1";
    }

    private static int ParsePort(string value)
    {
        var parts = value.Split(':', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries);
        return parts.Length > 1 && int.TryParse(parts[1], out var port) ? port : 6379;
    }
}
