namespace ArkaSoftwarePro.Src.Core.Contracts.DatabaseConnection;

public interface IDatabaseConnectionStringProvider
{
    string GetConnectionString();
    Task<bool> TestConnectionAsync(DatabaseConnectionSettingsSnapshot settings, CancellationToken cancellationToken = default);
}
