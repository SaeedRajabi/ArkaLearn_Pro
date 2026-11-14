using ArkaSoftwarePro.Src.Core.Contracts.Caching;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;

namespace ArkaSoftwarePro.Src.Endpoints.API.BackgroundServices.Caching;

/// <summary>
/// Periodically rebuilds query cache when enabled.
/// Interval = DefaultTtlMinutes from admin cache settings (e.g. 10 → every 10 minutes).
/// </summary>
public sealed class CacheAutoRefreshBackgroundService(
    IServiceScopeFactory scopeFactory,
    ILogger<CacheAutoRefreshBackgroundService> logger) : BackgroundService
{
    private DateTimeOffset _lastRefreshUtc = DateTimeOffset.MinValue;

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        // Let the API finish starting before the first refresh attempt.
        try
        {
            await Task.Delay(TimeSpan.FromSeconds(45), stoppingToken);
        }
        catch (OperationCanceledException)
        {
            return;
        }

        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                await TickAsync(stoppingToken);
            }
            catch (OperationCanceledException) when (stoppingToken.IsCancellationRequested)
            {
                break;
            }
            catch (Exception ex)
            {
                logger.LogWarning(ex, "Cache auto-refresh tick failed.");
            }

            try
            {
                await Task.Delay(TimeSpan.FromSeconds(30), stoppingToken);
            }
            catch (OperationCanceledException)
            {
                break;
            }
        }
    }

    private async Task TickAsync(CancellationToken cancellationToken)
    {
        await using var scope = scopeFactory.CreateAsyncScope();
        var settingsCache = scope.ServiceProvider.GetRequiredService<ICacheSettingsCache>();
        var warmup = scope.ServiceProvider.GetRequiredService<ICacheWarmupService>();

        var snapshot = await settingsCache.GetSnapshotAsync(cancellationToken);
        if (!snapshot.IsEnabled)
            return;

        var intervalMinutes = Math.Clamp(snapshot.DefaultTtlMinutes, 1, 1440);
        var dueAt = _lastRefreshUtc.AddMinutes(intervalMinutes);
        if (DateTimeOffset.UtcNow < dueAt)
            return;

        var status = warmup.GetStatus();
        if (string.Equals(status.Status, "Running", StringComparison.OrdinalIgnoreCase))
            return;

        logger.LogInformation(
            "Starting scheduled cache refresh. IntervalMinutes={Interval} Provider={Provider}",
            intervalMinutes,
            snapshot.Provider);

        var started = await warmup.StartAsync(cancellationToken);
        _lastRefreshUtc = DateTimeOffset.UtcNow;

        // Wait until this job finishes (or timeout) so we do not overlap ticks aggressively.
        var deadline = DateTimeOffset.UtcNow.AddMinutes(9);
        while (DateTimeOffset.UtcNow < deadline && !cancellationToken.IsCancellationRequested)
        {
            await Task.Delay(TimeSpan.FromSeconds(2), cancellationToken);
            var current = warmup.GetStatus(started.JobId);
            if (!string.Equals(current.Status, "Running", StringComparison.OrdinalIgnoreCase))
            {
                logger.LogInformation(
                    "Scheduled cache refresh finished. Status={Status} Percent={Percent}",
                    current.Status,
                    current.Percent);
                return;
            }
        }
    }
}
