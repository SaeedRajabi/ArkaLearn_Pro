namespace ArkaSoftwarePro.Src.Core.Contracts.DatabaseConnection;

public sealed class DatabaseConnectionSettingsSnapshot
{
    public bool UseDatabaseConnection { get; init; }
    public string Server { get; init; } = "localhost";
    public int? Port { get; init; }
    public string Database { get; init; } = string.Empty;
    public string UserId { get; init; } = string.Empty;
    public string? Password { get; init; }
    public bool TrustServerCertificate { get; init; } = true;
    public bool MultipleActiveResultSets { get; init; } = true;
}
