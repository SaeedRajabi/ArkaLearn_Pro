using ArkaSoftwarePro.Src.Core.Domain.DatabaseConnectionSettingsAggregate.Entities;
using Framework.Src.Core.Contracts.Data.Commands;
using DatabaseConnectionSettingsEntity = ArkaSoftwarePro.Src.Core.Domain.DatabaseConnectionSettingsAggregate.Entities.DatabaseConnectionSettings;

namespace ArkaSoftwarePro.Src.Core.Contracts.DatabaseConnection.DatabaseConnectionSettingsRepositoryContracts.Commands;

public interface IDatabaseConnectionSettingsCommandRepository : ICommandRepository<DatabaseConnectionSettingsEntity, long>
{
    Task<DatabaseConnectionSettingsEntity?> GetCurrentAsync(CancellationToken cancellationToken = default);
}
