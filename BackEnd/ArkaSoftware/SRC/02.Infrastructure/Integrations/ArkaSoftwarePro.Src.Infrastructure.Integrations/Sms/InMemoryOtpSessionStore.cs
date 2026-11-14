using System.Collections.Concurrent;
using ArkaSoftwarePro.Src.Core.Contracts.Sms;
using Extensions.DependentyInjection.Abstractions;

namespace ArkaSoftwarePro.Src.Infrastructure.Integrations.Sms;

/// <summary>
/// Process-local OTP session store (no Redis required).
/// </summary>
public sealed class InMemoryOtpSessionStore : IOtpSessionStore, ISingletoneLifetime
{
    private readonly ConcurrentDictionary<string, CacheEntry> _entries = new();

    public Task<string?> GetAsync(string key, CancellationToken cancellationToken = default)
    {
        if (!_entries.TryGetValue(key, out var entry))
            return Task.FromResult<string?>(null);

        if (entry.ExpiresAtUtc <= DateTime.UtcNow)
        {
            _entries.TryRemove(key, out _);
            return Task.FromResult<string?>(null);
        }

        return Task.FromResult<string?>(entry.Value);
    }

    public Task SetAsync(string key, string value, TimeSpan ttl, CancellationToken cancellationToken = default)
    {
        _entries[key] = new CacheEntry(value, DateTime.UtcNow.Add(ttl));
        return Task.CompletedTask;
    }

    public Task RemoveAsync(string key, CancellationToken cancellationToken = default)
    {
        _entries.TryRemove(key, out _);
        return Task.CompletedTask;
    }

    private sealed record CacheEntry(string Value, DateTime ExpiresAtUtc);
}
