using ArkaSoftwarePro.Src.Core.Contracts.DatabaseConnection;

namespace ArkaSoftwarePro.Src.Endpoints.API.BackgroundServices.DatabaseConnection;

public sealed class DatabaseConnectionCacheWarmupService(IDatabaseConnectionSettingsCache settingsCache) : IHostedService
{
    public async Task StartAsync(CancellationToken cancellationToken)
        => await settingsCache.EnsureLoadedAsync(cancellationToken);

    public Task StopAsync(CancellationToken cancellationToken) => Task.CompletedTask;
}
