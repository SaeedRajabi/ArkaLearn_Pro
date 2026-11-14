using ArkaSoftwarePro.Src.Core.Contracts.DatabaseConnection;
using Microsoft.Data.SqlClient;

namespace ArkaSoftwarePro.Src.Infrastructure.Integrations.DatabaseConnection;

public sealed class DatabaseConnectionStringProvider(
    IDatabaseConnectionSettingsCache settingsCache,
    IBootstrapConnectionStringProvider bootstrapProvider) : IDatabaseConnectionStringProvider
{
    public string GetConnectionString()
    {
        var snapshot = settingsCache.GetSnapshot();
        return DatabaseConnectionStringBuilder.Resolve(snapshot, bootstrapProvider.GetConnectionString());
    }

    public async Task<bool> TestConnectionAsync(
        DatabaseConnectionSettingsSnapshot settings,
        CancellationToken cancellationToken = default)
    {
        try
        {
            var connectionString = DatabaseConnectionStringBuilder.Build(settings);
            if (string.IsNullOrWhiteSpace(connectionString))
                return false;

            await using var connection = new SqlConnection(connectionString);
            await connection.OpenAsync(cancellationToken);
            await using var command = connection.CreateCommand();
            command.CommandText = "SELECT 1";
            await command.ExecuteScalarAsync(cancellationToken);
            return true;
        }
        catch
        {
            return false;
        }
    }
}
