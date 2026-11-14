using ArkaSoftwarePro.Src.Core.Contracts.Caching;

using Microsoft.Extensions.DependencyInjection;



namespace ArkaSoftwarePro.Src.Core.ApplicationService.CacheSettingsServices;



/// <summary>

/// Process-wide cache of DB settings. Resolves a scoped loader per read/refresh

/// so the singleton never captures a disposed DbContext.

/// </summary>

public sealed class CacheSettingsCache(IServiceScopeFactory scopeFactory) : ICacheSettingsCache

{

    private readonly SemaphoreSlim _gate = new(1, 1);

    private CacheSettingsSnapshot? _snapshot;



    public async ValueTask<CacheSettingsSnapshot> GetSnapshotAsync(CancellationToken cancellationToken = default)

    {

        if (_snapshot is not null)

            return _snapshot;



        await _gate.WaitAsync(cancellationToken);

        try

        {

            if (_snapshot is null)

                _snapshot = await LoadWithScopeAsync(cancellationToken);

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

            // Clear first so concurrent readers do not keep serving a stale IsEnabled=true snapshot.

            _snapshot = null;

            _snapshot = await LoadWithScopeAsync(cancellationToken);

        }

        finally

        {

            _gate.Release();

        }

    }



    private async Task<CacheSettingsSnapshot> LoadWithScopeAsync(CancellationToken cancellationToken)

    {

        await using var scope = scopeFactory.CreateAsyncScope();

        var loader = scope.ServiceProvider.GetRequiredService<CacheSettingsLoader>();

        return await loader.LoadAsync(cancellationToken);

    }

}

