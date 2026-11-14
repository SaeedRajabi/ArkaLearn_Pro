using Framework.Src.Core.Domain.Aggregates;

namespace ArkaSoftwarePro.Src.Core.Domain.CacheSettingsAggregate.Entities;

public class CacheSettings : AggregateRoot
{
    public bool IsEnabled { get; private set; }
    public string Provider { get; private set; } = "InMemory";
    public int DefaultTtlMinutes { get; private set; } = 30;
    public string RedisHost { get; private set; } = "127.0.0.1";
    public int RedisPort { get; private set; } = 6379;
    public string? RedisPasswordEncrypted { get; private set; }
    public string RedisInstanceName { get; private set; } = "ArkaLearn:";
    public bool RedisUseSsl { get; private set; }
    public bool CacheCoursesEnabled { get; private set; } = true;
    public bool CacheArticlesEnabled { get; private set; } = true;
    public bool CacheSeminarsEnabled { get; private set; } = true;
    public bool CacheBooksEnabled { get; private set; } = true;
    public bool CacheSoftwareEnabled { get; private set; } = true;
    public bool CacheTeacherAdsEnabled { get; private set; } = true;
    public bool CacheFilesEnabled { get; private set; } = true;
    public bool CacheCategoriesEnabled { get; private set; } = true;
    public bool CacheTeachersEnabled { get; private set; } = true;
    public bool CacheProjectsEnabled { get; private set; } = true;

    private CacheSettings()
    {
    }

    public CacheSettings(
        bool isEnabled,
        string provider,
        int defaultTtlMinutes,
        string redisHost,
        int redisPort,
        string? redisPasswordEncrypted,
        string redisInstanceName,
        bool redisUseSsl,
        bool cacheCoursesEnabled,
        bool cacheArticlesEnabled,
        bool cacheSeminarsEnabled,
        bool cacheBooksEnabled,
        bool cacheSoftwareEnabled,
        bool cacheTeacherAdsEnabled,
        bool cacheFilesEnabled,
        bool cacheCategoriesEnabled,
        bool cacheTeachersEnabled,
        bool cacheProjectsEnabled)
    {
        Update(
            isEnabled,
            provider,
            defaultTtlMinutes,
            redisHost,
            redisPort,
            redisPasswordEncrypted,
            redisInstanceName,
            redisUseSsl,
            cacheCoursesEnabled,
            cacheArticlesEnabled,
            cacheSeminarsEnabled,
            cacheBooksEnabled,
            cacheSoftwareEnabled,
            cacheTeacherAdsEnabled,
            cacheFilesEnabled,
            cacheCategoriesEnabled,
            cacheTeachersEnabled,
            cacheProjectsEnabled);
    }

    public void Update(
        bool isEnabled,
        string provider,
        int defaultTtlMinutes,
        string redisHost,
        int redisPort,
        string? redisPasswordEncrypted,
        string redisInstanceName,
        bool redisUseSsl,
        bool cacheCoursesEnabled,
        bool cacheArticlesEnabled,
        bool cacheSeminarsEnabled,
        bool cacheBooksEnabled,
        bool cacheSoftwareEnabled,
        bool cacheTeacherAdsEnabled,
        bool cacheFilesEnabled,
        bool cacheCategoriesEnabled,
        bool cacheTeachersEnabled,
        bool cacheProjectsEnabled)
    {
        IsEnabled = isEnabled;
        Provider = NormalizeProvider(provider);
        DefaultTtlMinutes = defaultTtlMinutes is < 1 or > 1440 ? 30 : defaultTtlMinutes;
        RedisHost = string.IsNullOrWhiteSpace(redisHost) ? "127.0.0.1" : redisHost.Trim();
        RedisPort = redisPort is < 1 or > 65535 ? 6379 : redisPort;
        if (redisPasswordEncrypted != null)
            RedisPasswordEncrypted = string.IsNullOrWhiteSpace(redisPasswordEncrypted) ? null : redisPasswordEncrypted;
        RedisInstanceName = string.IsNullOrWhiteSpace(redisInstanceName) ? "ArkaLearn:" : redisInstanceName.Trim();
        RedisUseSsl = redisUseSsl;
        CacheCoursesEnabled = cacheCoursesEnabled;
        CacheArticlesEnabled = cacheArticlesEnabled;
        CacheSeminarsEnabled = cacheSeminarsEnabled;
        CacheBooksEnabled = cacheBooksEnabled;
        CacheSoftwareEnabled = cacheSoftwareEnabled;
        CacheTeacherAdsEnabled = cacheTeacherAdsEnabled;
        CacheFilesEnabled = cacheFilesEnabled;
        CacheCategoriesEnabled = cacheCategoriesEnabled;
        CacheTeachersEnabled = cacheTeachersEnabled;
        CacheProjectsEnabled = cacheProjectsEnabled;
    }

    private static string NormalizeProvider(string? provider)
    {
        var value = (provider ?? string.Empty).Trim();
        return string.Equals(value, "Redis", StringComparison.OrdinalIgnoreCase)
            ? "Redis"
            : "InMemory";
    }
}
