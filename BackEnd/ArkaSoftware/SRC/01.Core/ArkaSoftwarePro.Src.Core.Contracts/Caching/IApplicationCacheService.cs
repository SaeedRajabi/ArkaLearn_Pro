namespace ArkaSoftwarePro.Src.Core.Contracts.Caching;

using ArkaSoftwarePro.Src.Core.Domain.Caching;

public interface IApplicationCacheService
{
    Task<T?> GetAsync<T>(CacheRegion region, string key, CancellationToken cancellationToken = default);

    Task SetAsync<T>(
        CacheRegion region,
        string key,
        T value,
        TimeSpan? ttl = null,
        CancellationToken cancellationToken = default);

    Task RemoveAsync(CacheRegion region, string key, CancellationToken cancellationToken = default);

    Task InvalidateRegionAsync(CacheRegion region, CancellationToken cancellationToken = default);

    Task InvalidateAllAsync(CancellationToken cancellationToken = default);

    Task<bool> TestRedisConnectionAsync(CacheSettingsSnapshot settings, CancellationToken cancellationToken = default);
}
