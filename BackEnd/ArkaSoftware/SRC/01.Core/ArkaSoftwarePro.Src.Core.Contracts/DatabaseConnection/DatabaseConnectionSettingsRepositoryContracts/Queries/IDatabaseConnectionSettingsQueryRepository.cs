using ArkaSoftwarePro.Src.Core.RequestResponse.DatabaseConnectionSettings.Queries.GetDatabaseConnectionSettings;

namespace ArkaSoftwarePro.Src.Core.Contracts.DatabaseConnection.DatabaseConnectionSettingsRepositoryContracts.Queries;

public interface IDatabaseConnectionSettingsQueryRepository
{
    Task<DatabaseConnectionSettingsQri?> GetCurrentAsync(CancellationToken cancellationToken = default);
}
