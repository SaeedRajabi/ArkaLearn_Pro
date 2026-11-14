using Framework.Src.Core.Contracts.Data.Commands;
using LiveMediaTransportSettingsEntity = ArkaSoftwarePro.Src.Core.Domain.LiveMediaTransportSettingsAggregate.Entities.LiveMediaTransportSettings;

namespace ArkaSoftwarePro.Src.Core.Contracts.LiveMediaTransportSettings.LiveMediaTransportSettingsRepositoryContracts.Commands;

public interface ILiveMediaTransportSettingsCommandRepository
    : ICommandRepository<LiveMediaTransportSettingsEntity, long>
{
    Task<LiveMediaTransportSettingsEntity?> GetCurrentAsync(CancellationToken cancellationToken = default);
}
