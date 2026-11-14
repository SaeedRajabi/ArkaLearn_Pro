using ArkaSoftwarePro.Src.Core.Contracts.DatabaseConnection;

namespace ArkaSoftwarePro.Src.Infrastructure.Integrations.DatabaseConnection;

public sealed class DatabaseConnectionSettingsCache(DatabaseConnectionSettingsLoader loader) : IDatabaseConnectionSettingsCache
{
    private readonly SemaphoreSlim _gate = new(1, 1);
    private DatabaseConnectionSettingsSnapshot? _snapshot;

    public DatabaseConnectionSettingsSnapshot GetSnapshot()
    {
        if (_snapshot is not null)
            return _snapshot;

        _gate.Wait();
        try
        {
            _snapshot ??= loader.LoadAsync().GetAwaiter().GetResult();
            return _snapshot;
        }
        finally
        {
            _gate.Release();
        }
    }

    public async Task RefreshAsync(CancellationToken cancellationToken = default)
    {
        await _gate.WaitAsync(cancellationToken);
        try
        {
            _snapshot = await loader.LoadAsync(cancellationToken);
        }
        finally
        {
            _gate.Release();
        }
    }

    public async Task EnsureLoadedAsync(CancellationToken cancellationToken = default)
    {
        if (_snapshot is not null)
            return;

        await _gate.WaitAsync(cancellationToken);
        try
        {
            _snapshot ??= await loader.LoadAsync(cancellationToken);
        }
        finally
        {
            _gate.Release();
        }
    }
}
