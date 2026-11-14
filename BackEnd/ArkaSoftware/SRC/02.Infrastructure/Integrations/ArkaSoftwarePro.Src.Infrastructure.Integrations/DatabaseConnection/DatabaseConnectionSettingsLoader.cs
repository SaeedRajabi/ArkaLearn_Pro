using ArkaSoftwarePro.Src.Core.Contracts.DatabaseConnection;
using ArkaSoftwarePro.Src.Core.Contracts.Security;
using Microsoft.Data.SqlClient;

namespace ArkaSoftwarePro.Src.Infrastructure.Integrations.DatabaseConnection;

internal static class DatabaseConnectionStringBuilder
{
    public static string? Build(DatabaseConnectionSettingsSnapshot settings)
    {
        if (!settings.UseDatabaseConnection ||
            string.IsNullOrWhiteSpace(settings.Database) ||
            string.IsNullOrWhiteSpace(settings.UserId))
        {
            return null;
        }

        var builder = new SqlConnectionStringBuilder
        {
            DataSource = settings.Port is > 0 ? $"{settings.Server},{settings.Port}" : settings.Server,
            InitialCatalog = settings.Database,
            UserID = settings.UserId,
            Password = settings.Password ?? string.Empty,
            TrustServerCertificate = settings.TrustServerCertificate,
            MultipleActiveResultSets = settings.MultipleActiveResultSets,
        };
        return builder.ConnectionString;
    }

    public static string Resolve(DatabaseConnectionSettingsSnapshot settings, string bootstrapConnectionString)
    {
        var built = Build(settings);
        var connectionString = !string.IsNullOrWhiteSpace(built) ? built : bootstrapConnectionString;
        return ApplyPoolDefaults(connectionString);
    }

    /// <summary>
    /// The database is typically reached over a WAN. With framework defaults
    /// (max pool 100, min pool 0, 15s connect timeout) a burst of concurrent
    /// requests exhausts the pool while new connections are still handshaking,
    /// producing "Timeout expired ... obtaining a connection from the pool".
    /// Pre-warm a small set and fail fast when the pool is saturated.
    /// </summary>
    private static string ApplyPoolDefaults(string connectionString)
    {
        if (string.IsNullOrWhiteSpace(connectionString))
            return connectionString;

        var builder = new SqlConnectionStringBuilder(connectionString)
        {
            MaxPoolSize = 300,
            MinPoolSize = 10,
            ConnectTimeout = 10,
        };
        return builder.ConnectionString;
    }
}

public sealed class DatabaseConnectionSettingsLoader(
    IBootstrapConnectionStringProvider bootstrapProvider,
    ISecretProtector secretProtector)
{
    public async Task<DatabaseConnectionSettingsSnapshot> LoadAsync(CancellationToken cancellationToken = default)
    {
        try
        {
            await using var connection = new SqlConnection(bootstrapProvider.GetConnectionString());
            await connection.OpenAsync(cancellationToken);

            await using var command = connection.CreateCommand();
            command.CommandText = """
                SELECT TOP (1)
                    UseDatabaseConnection,
                    Server,
                    Port,
                    [Database],
                    UserId,
                    PasswordEncrypted,
                    TrustServerCertificate,
                    MultipleActiveResultSets
                FROM Website.DatabaseConnectionSettings
                ORDER BY Id DESC
                """;

            await using var reader = await command.ExecuteReaderAsync(cancellationToken);
            if (!await reader.ReadAsync(cancellationToken))
            {
                return new DatabaseConnectionSettingsSnapshot
                {
                    UseDatabaseConnection = false,
                };
            }

            return new DatabaseConnectionSettingsSnapshot
            {
                UseDatabaseConnection = reader.GetBoolean(0),
                Server = reader.GetString(1),
                Port = await reader.IsDBNullAsync(2, cancellationToken) ? null : reader.GetInt32(2),
                Database = reader.GetString(3),
                UserId = reader.GetString(4),
                Password = secretProtector.Unprotect(
                    await reader.IsDBNullAsync(5, cancellationToken) ? null : reader.GetString(5)),
                TrustServerCertificate = reader.GetBoolean(6),
                MultipleActiveResultSets = reader.GetBoolean(7),
            };
        }
        catch (SqlException ex) when (ex.Number is 208 or 4060)
        {
            return new DatabaseConnectionSettingsSnapshot
            {
                UseDatabaseConnection = false,
            };
        }
    }
}
