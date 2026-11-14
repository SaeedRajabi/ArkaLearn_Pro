namespace ArkaSoftwarePro.Src.Infrastructure.Data.MSSQL.Queries.Entities.DatabaseConnectionSettings;

public class DatabaseConnectionSettingsQueryModel
{
    public long Id { get; set; }
    public bool UseDatabaseConnection { get; set; }
    public string Server { get; set; } = "localhost";
    public int? Port { get; set; }
    public string Database { get; set; } = string.Empty;
    public string UserId { get; set; } = string.Empty;
    public string? PasswordEncrypted { get; set; }
    public bool TrustServerCertificate { get; set; } = true;
    public bool MultipleActiveResultSets { get; set; } = true;
}
