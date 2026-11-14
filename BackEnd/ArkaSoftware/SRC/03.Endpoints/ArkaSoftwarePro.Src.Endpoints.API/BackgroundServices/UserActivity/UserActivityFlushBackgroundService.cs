using ArkaSoftwarePro.Src.Core.Contracts.UserActivity;

namespace ArkaSoftwarePro.Src.Endpoints.API.BackgroundServices.UserActivity;

public sealed class UserActivityFlushBackgroundService(
    IServiceScopeFactory scopeFactory,
    IUserActivityBuffer activityBuffer,
    ILogger<UserActivityFlushBackgroundService> logger) : BackgroundService
{
    private static readonly TimeSpan FlushInterval = TimeSpan.FromSeconds(30);

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        try
        {
            await Task.Delay(TimeSpan.FromSeconds(15), stoppingToken);
        }
        catch (TaskCanceledException)
        {
            return;
        }

        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                await FlushAsync(stoppingToken);
            }
            catch (Exception ex)
            {
                logger.LogError(ex, "Failed to flush user activity buffer to database.");
            }

            try
            {
                await Task.Delay(FlushInterval, stoppingToken);
            }
            catch (TaskCanceledException)
            {
                break;
            }
        }
    }

    public override async Task StopAsync(CancellationToken cancellationToken)
    {
        try
        {
            await FlushAsync(cancellationToken);
        }
        catch (Exception ex)
        {
            logger.LogWarning(ex, "User activity buffer flush on shutdown failed.");
        }

        await base.StopAsync(cancellationToken);
    }

    private async Task FlushAsync(CancellationToken cancellationToken)
    {
        var pending = activityBuffer.DrainAllForPersistence();
        if (pending.Count == 0)
            return;

        try
        {
            using var scope = scopeFactory.CreateScope();
            var repository = scope.ServiceProvider.GetRequiredService<IUserActivityRepository>();
            await repository.BulkInsertAsync(pending, cancellationToken);
            logger.LogInformation("Flushed {Count} user activity events to SQL Server.", pending.Count);
        }
        catch
        {
            activityBuffer.Restore(pending);
            throw;
        }
    }
}
