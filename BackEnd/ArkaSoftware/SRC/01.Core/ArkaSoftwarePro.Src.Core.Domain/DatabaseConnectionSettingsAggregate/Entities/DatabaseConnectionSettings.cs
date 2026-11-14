using Framework.Src.Core.Domain.Aggregates;

namespace ArkaSoftwarePro.Src.Core.Domain.DatabaseConnectionSettingsAggregate.Entities;

public class DatabaseConnectionSettings : AggregateRoot
{
    public bool UseDatabaseConnection { get; private set; }
    public string Server { get; private set; } = "localhost";
    public int? Port { get; private set; }
    public string Database { get; private set; } = string.Empty;
    public string UserId { get; private set; } = string.Empty;
    public string? PasswordEncrypted { get; private set; }
    public bool TrustServerCertificate { get; private set; } = true;
    public bool MultipleActiveResultSets { get; private set; } = true;

    private DatabaseConnectionSettings()
    {
    }

    public DatabaseConnectionSettings(
        bool useDatabaseConnection,
        string server,
        int? port,
        string database,
        string userId,
        string? passwordEncrypted,
        bool trustServerCertificate,
        bool multipleActiveResultSets)
    {
        Update(
            useDatabaseConnection,
            server,
            port,
            database,
            userId,
            passwordEncrypted,
            trustServerCertificate,
            multipleActiveResultSets);
    }

    public void Update(
        bool useDatabaseConnection,
        string server,
        int? port,
        string database,
        string userId,
        string? passwordEncrypted,
        bool trustServerCertificate,
        bool multipleActiveResultSets)
    {
        UseDatabaseConnection = useDatabaseConnection;
        Server = string.IsNullOrWhiteSpace(server) ? "localhost" : server.Trim();
        Port = port is < 1 or > 65535 ? null : port;
        Database = string.IsNullOrWhiteSpace(database) ? string.Empty : database.Trim();
        UserId = string.IsNullOrWhiteSpace(userId) ? string.Empty : userId.Trim();
        if (passwordEncrypted != null)
            PasswordEncrypted = string.IsNullOrWhiteSpace(passwordEncrypted) ? null : passwordEncrypted;
        TrustServerCertificate = trustServerCertificate;
        MultipleActiveResultSets = multipleActiveResultSets;
    }
}
