using ArkaSoftwarePro.Src.Core.Domain.SecuritySettingsAggregate.Entities;
using Framework.Src.Core.Contracts.Data.Commands;
using SecuritySettingsEntity = ArkaSoftwarePro.Src.Core.Domain.SecuritySettingsAggregate.Entities.SecuritySettings;

namespace ArkaSoftwarePro.Src.Core.Contracts.SecuritySettings.SecuritySettingsRepositoryContracts.Commands;

public interface ISecuritySettingsCommandRepository : ICommandRepository<SecuritySettingsEntity, long>
{
    Task<SecuritySettingsEntity?> GetCurrentAsync();
}
