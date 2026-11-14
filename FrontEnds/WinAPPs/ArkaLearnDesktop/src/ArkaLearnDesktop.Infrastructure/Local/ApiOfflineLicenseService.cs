using ArkaLearnDesktop.Application.Abstractions;

namespace ArkaLearnDesktop.Infrastructure.Local;

/// <summary>Session memory cache for offline grants. Source of truth is SQL Server via DesktopDrm API.</summary>
public sealed class ApiOfflineLicenseService : IOfflineLicenseService
{
    private readonly Dictionary<long, GrantEntry> _cache = new();

    public Task<bool> HasValidOfflineGrantAsync(
        long courseId,
        string? deviceId = null,
        CancellationToken cancellationToken = default) =>
        Task.FromResult(GetValid(courseId, deviceId) is not null);

    public Task<string?> GetGrantTokenAsync(
        long courseId,
        string? deviceId = null,
        CancellationToken cancellationToken = default) =>
        Task.FromResult(GetValid(courseId, deviceId)?.GrantToken);

    public Task SaveGrantAsync(
        long courseId,
        string grantToken,
        DateTime expiresAtUtc,
        string deviceId,
        CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(grantToken)) return Task.CompletedTask;
        _cache[courseId] = new GrantEntry(grantToken, expiresAtUtc, deviceId);
        return Task.CompletedTask;
    }

    private GrantEntry? GetValid(long courseId, string? deviceId)
    {
        if (!_cache.TryGetValue(courseId, out var entry)) return null;
        if (DateTime.UtcNow >= entry.ExpiresAtUtc)
        {
            _cache.Remove(courseId);
            return null;
        }

        if (!string.IsNullOrWhiteSpace(entry.DeviceId)
            && !string.IsNullOrWhiteSpace(deviceId)
            && !string.Equals(entry.DeviceId, deviceId, StringComparison.OrdinalIgnoreCase))
        {
            _cache.Remove(courseId);
            return null;
        }

        return entry;
    }

    private sealed record GrantEntry(string GrantToken, DateTime ExpiresAtUtc, string DeviceId);
}
