namespace ArkaSoftwarePro.Src.Core.Contracts.Caching;

using ArkaSoftwarePro.Src.Core.Domain.Caching;

public sealed class CacheSettingsSnapshot
{
    public bool IsEnabled { get; init; }
    public string Provider { get; init; } = CacheProviderType.InMemory;
    public int DefaultTtlMinutes { get; init; } = 30;
    public string RedisHost { get; init; } = "127.0.0.1";
    public int RedisPort { get; init; } = 6379;
    public string? RedisPassword { get; init; }
    public string RedisInstanceName { get; init; } = "ArkaLearn:";
    public bool RedisUseSsl { get; init; }
    public bool CacheCoursesEnabled { get; init; } = true;
    public bool CacheArticlesEnabled { get; init; } = true;
    public bool CacheSeminarsEnabled { get; init; } = true;
    public bool CacheBooksEnabled { get; init; } = true;
    public bool CacheSoftwareEnabled { get; init; } = true;
    public bool CacheTeacherAdsEnabled { get; init; } = true;
    public bool CacheFilesEnabled { get; init; } = true;
    public bool CacheCategoriesEnabled { get; init; } = true;
    public bool CacheTeachersEnabled { get; init; } = true;
    public bool CacheProjectsEnabled { get; init; } = true;

    public bool IsRegionEnabled(CacheRegion region)
    {
        if (!IsEnabled)
            return false;

        return region switch
        {
            CacheRegion.Courses => CacheCoursesEnabled,
            CacheRegion.Articles => CacheArticlesEnabled,
            CacheRegion.Seminars => CacheSeminarsEnabled,
            CacheRegion.Books => CacheBooksEnabled,
            CacheRegion.Software => CacheSoftwareEnabled,
            CacheRegion.TeacherAds => CacheTeacherAdsEnabled,
            CacheRegion.Files => CacheFilesEnabled,
            CacheRegion.Categories => CacheCategoriesEnabled,
            CacheRegion.Teachers => CacheTeachersEnabled,
            CacheRegion.Projects => CacheProjectsEnabled,
            _ => false,
        };
    }
}
