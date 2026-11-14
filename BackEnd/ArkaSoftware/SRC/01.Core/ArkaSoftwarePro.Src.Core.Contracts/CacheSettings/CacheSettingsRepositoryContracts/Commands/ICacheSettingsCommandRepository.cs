using ArkaSoftwarePro.Src.Core.Domain.CacheSettingsAggregate.Entities;
using Framework.Src.Core.Contracts.Data.Commands;
using CacheSettingsEntity = ArkaSoftwarePro.Src.Core.Domain.CacheSettingsAggregate.Entities.CacheSettings;

namespace ArkaSoftwarePro.Src.Core.Contracts.CacheSettings.CacheSettingsRepositoryContracts.Commands;

public interface ICacheSettingsCommandRepository : ICommandRepository<CacheSettingsEntity, long>
{
    Task<CacheSettingsEntity?> GetCurrentAsync(CancellationToken cancellationToken = default);

    /// <summary>Force EF to persist all scalar fields (including IsEnabled=false).</summary>
    void MarkModified(CacheSettingsEntity entity);

    /// <summary>Bypass change-tracker quirks and write IsEnabled with ExecuteUpdate.</summary>
    Task ForceSetIsEnabledAsync(long id, bool isEnabled, CancellationToken cancellationToken = default);
}
