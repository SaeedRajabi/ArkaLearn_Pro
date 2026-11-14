using Framework.Src.Core.Contracts.Data.Commands;
using GoogleAuthSettingsEntity = ArkaSoftwarePro.Src.Core.Domain.GoogleAuthSettingsAggregate.Entities.GoogleAuthSettings;

namespace ArkaSoftwarePro.Src.Core.Contracts.GoogleAuthSettings.GoogleAuthSettingsRepositoryContracts.Commands;

public interface IGoogleAuthSettingsCommandRepository : ICommandRepository<GoogleAuthSettingsEntity, long>
{
    Task<GoogleAuthSettingsEntity?> GetCurrentAsync();
}
