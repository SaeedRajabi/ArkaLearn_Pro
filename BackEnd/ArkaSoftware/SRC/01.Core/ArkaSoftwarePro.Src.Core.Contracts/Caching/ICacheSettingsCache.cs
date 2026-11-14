namespace ArkaSoftwarePro.Src.Core.Contracts.Caching;

public interface ICacheSettingsCache
{
    ValueTask<CacheSettingsSnapshot> GetSnapshotAsync(CancellationToken cancellationToken = default);
    Task RefreshAsync(CancellationToken cancellationToken = default);
}
