using ArkaSoftwarePro.Src.Core.RequestResponse.CacheSettings.Queries.GetCacheSettings;

namespace ArkaSoftwarePro.Src.Core.Contracts.CacheSettings.CacheSettingsRepositoryContracts.Queries;

public interface ICacheSettingsQueryRepository
{
    Task<CacheSettingsQri?> GetCurrentAsync(CancellationToken cancellationToken = default);
}
