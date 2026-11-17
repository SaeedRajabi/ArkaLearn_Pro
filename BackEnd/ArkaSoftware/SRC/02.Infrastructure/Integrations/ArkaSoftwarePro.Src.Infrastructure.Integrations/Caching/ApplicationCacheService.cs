using ArkaSoftwarePro.Src.Core.Contracts.Caching;
using ArkaSoftwarePro.Src.Core.Domain.Caching;
using Microsoft.Extensions.Caching.Memory;
using StackExchange.Redis;
using System.Collections.Concurrent;
using System.Security.Cryptography;
using System.Text;
using System.Text.Json;

namespace ArkaSoftwarePro.Src.Infrastructure.Integrations.Caching;

internal static class CacheKeyBuilder
{
    private static readonly JsonSerializerOptions JsonOptions = new(JsonSerializerDefaults.Web);

    public static string BuildQueryKey<TQuery>(TQuery query)
    {
        var json = JsonSerializer.Serialize(query, JsonOptions);
        var hash = Convert.ToHexString(SHA256.HashData(Encoding.UTF8.GetBytes(json)))[..24];
        return $"{typeof(TQuery).Name}:{hash}";
    }

    public static string BuildStorageKey(CacheRegion region, string key, string instanceName)
        => $"{instanceName}cache:{region}:{key}";

    public static string BuildRegionMetaKey(CacheRegion region, string instanceName)
        => $"{instanceName}meta:{region}";
}

public sealed class RedisConnectionManager
{
    private readonly SemaphoreSlim _gate = new(1, 1);
    private IConnectionMultiplexer? _multiplexer;
    private string? _signature;

    public async Task<IConnectionMultiplexer?> GetOrConnectAsync(
        CacheSettingsSnapshot settings,
        CancellationToken cancellationToken = default)
    {
        if (!string.Equals(settings.Provider, CacheProviderType.Redis, StringComparison.Ordinal))
            return null;

        var signature = BuildSignature(settings);
        if (_multiplexer is not null && string.Equals(_signature, signature, StringComparison.Ordinal))
            return _multiplexer;

        await _gate.WaitAsync(cancellationToken);
        try
        {
            if (_multiplexer is not null && string.Equals(_signature, signature, StringComparison.Ordinal))
                return _multiplexer;

            await DisposeAsync();
            var options = ConfigurationOptions.Parse($"{settings.RedisHost}:{settings.RedisPort}");
            options.AbortOnConnectFail = false;
            options.ConnectTimeout = 5000;
            options.SyncTimeout = 5000;
            if (!string.IsNullOrWhiteSpace(settings.RedisPassword))
                options.Password = settings.RedisPassword;
            if (settings.RedisUseSsl)
                options.Ssl = true;

            _multiplexer = await ConnectionMultiplexer.ConnectAsync(options);
            _signature = signature;
            return _multiplexer;
        }
        finally
        {
            _gate.Release();
        }
    }

    public async Task ResetAsync()
    {
        await _gate.WaitAsync();
        try
        {
            await DisposeAsync();
        }
        finally
        {
            _gate.Release();
        }
    }

    private async Task DisposeAsync()
    {
        if (_multiplexer is null)
            return;

        try
        {
            await _multiplexer.CloseAsync();
            _multiplexer.Dispose();
        }
        catch
        {
            // ignored
        }
        finally
        {
            _multiplexer = null;
            _signature = null;
        }
    }

    private static string BuildSignature(CacheSettingsSnapshot settings)
        => $"{settings.RedisHost}|{settings.RedisPort}|{settings.RedisPassword}|{settings.RedisUseSsl}|{settings.RedisInstanceName}";
}

public sealed class ApplicationCacheService(
    IMemoryCache memoryCache,
    ICacheSettingsCache settingsCache,
    RedisConnectionManager redisConnectionManager) : IApplicationCacheService
{
    private static readonly JsonSerializerOptions JsonOptions = new(JsonSerializerDefaults.Web);
    private readonly ConcurrentDictionary<CacheRegion, ConcurrentDictionary<string, byte>> _memoryRegionKeys = new();

    public async Task<T?> GetAsync<T>(CacheRegion region, string key, CancellationToken cancellationToken = default)
    {
        try
        {
            var settings = await settingsCache.GetSnapshotAsync(cancellationToken);
            if (!settings.IsEnabled || !settings.IsRegionEnabled(region))
                return default;

            var storageKey = CacheKeyBuilder.BuildStorageKey(region, key, settings.RedisInstanceName);
            if (string.Equals(settings.Provider, CacheProviderType.Redis, StringComparison.Ordinal))
            {
                IConnectionMultiplexer? redis = await redisConnectionManager.GetOrConnectAsync(settings, cancellationToken);
                if (redis is null)
                    return default;

                RedisValue value = await redis.GetDatabase().StringGetAsync(storageKey);
                if (value.IsNullOrEmpty)
                    return default;

                return JsonSerializer.Deserialize<T>((byte[])value!, JsonOptions);
            }

            return memoryCache.TryGetValue(storageKey, out T? cached) ? cached : default;
        }
        catch
        {
            return default;
        }
    }

    public async Task SetAsync<T>(
        CacheRegion region,
        string key,
        T value,
        TimeSpan? ttl = null,
        CancellationToken cancellationToken = default)
    {
        try
        {
            var settings = await settingsCache.GetSnapshotAsync(cancellationToken);
            if (!settings.IsEnabled || !settings.IsRegionEnabled(region))
                return;

            var storageKey = CacheKeyBuilder.BuildStorageKey(region, key, settings.RedisInstanceName);
            var expiration = ttl ?? TimeSpan.FromMinutes(settings.DefaultTtlMinutes);
            var payload = JsonSerializer.Serialize(value, JsonOptions);

            if (string.Equals(settings.Provider, CacheProviderType.Redis, StringComparison.Ordinal))
            {
                var redis = await redisConnectionManager.GetOrConnectAsync(settings, cancellationToken);
                if (redis is null)
                    return;

                var db = redis.GetDatabase();
                await db.StringSetAsync(storageKey, payload, expiration);
                await db.SetAddAsync(CacheKeyBuilder.BuildRegionMetaKey(region, settings.RedisInstanceName), storageKey);
                return;
            }

            memoryCache.Set(storageKey, value, expiration);
            var regionKeys = _memoryRegionKeys.GetOrAdd(region, _ => new ConcurrentDictionary<string, byte>());
            regionKeys[storageKey] = 0;
        }
        catch
        {
            // best effort — never fail the request because cache write failed
        }
    }

    public async Task RemoveAsync(CacheRegion region, string key, CancellationToken cancellationToken = default)
    {
        var settings = await settingsCache.GetSnapshotAsync(cancellationToken);
        var storageKey = CacheKeyBuilder.BuildStorageKey(region, key, settings.RedisInstanceName);

        if (string.Equals(settings.Provider, CacheProviderType.Redis, StringComparison.Ordinal))
        {
            var redis = await redisConnectionManager.GetOrConnectAsync(settings, cancellationToken);
            if (redis is null)
                return;

            var db = redis.GetDatabase();
            await db.KeyDeleteAsync(storageKey);
            await db.SetRemoveAsync(CacheKeyBuilder.BuildRegionMetaKey(region, settings.RedisInstanceName), storageKey);
            return;
        }

        memoryCache.Remove(storageKey);
        if (_memoryRegionKeys.TryGetValue(region, out var regionKeys))
            regionKeys.TryRemove(storageKey, out _);
    }

    public async Task InvalidateRegionAsync(CacheRegion region, CancellationToken cancellationToken = default)
    {
        var settings = await settingsCache.GetSnapshotAsync(cancellationToken);

        if (string.Equals(settings.Provider, CacheProviderType.Redis, StringComparison.Ordinal))
        {
            var redis = await redisConnectionManager.GetOrConnectAsync(settings, cancellationToken);
            if (redis is null)
                return;

            var db = redis.GetDatabase();
            var metaKey = CacheKeyBuilder.BuildRegionMetaKey(region, settings.RedisInstanceName);
            var members = await db.SetMembersAsync(metaKey);
            if (members.Length > 0)
            {
                var keys = members.Select(x => (RedisKey)x.ToString()).ToArray();
                await db.KeyDeleteAsync(keys);
            }
            await db.KeyDeleteAsync(metaKey);
            return;
        }

        if (_memoryRegionKeys.TryRemove(region, out var regionKeys))
        {
            foreach (var storageKey in regionKeys.Keys)
                memoryCache.Remove(storageKey);
        }
    }

    public async Task InvalidateAllAsync(CancellationToken cancellationToken = default)
    {
        foreach (CacheRegion region in Enum.GetValues<CacheRegion>())
            await InvalidateRegionAsync(region, cancellationToken);
    }

    public async Task<bool> TestRedisConnectionAsync(CacheSettingsSnapshot settings, CancellationToken cancellationToken = default)
    {
        try
        {
            var redis = await redisConnectionManager.GetOrConnectAsync(settings, cancellationToken);
            if (redis is null)
                return false;

            var pong = await redis.GetDatabase().PingAsync();
            return pong.TotalMilliseconds >= 0;
        }
        catch
        {
            return false;
        }
    }
}
