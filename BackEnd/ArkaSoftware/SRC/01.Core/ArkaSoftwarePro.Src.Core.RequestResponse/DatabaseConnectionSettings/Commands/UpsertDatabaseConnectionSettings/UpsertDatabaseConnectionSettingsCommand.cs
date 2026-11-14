using Framework.Src.Core.RequestResponse.Commands;
using Framework.Src.Core.RequestResponse.Endpoints;

namespace ArkaSoftwarePro.Src.Core.RequestResponse.DatabaseConnectionSettings.Commands.UpsertDatabaseConnectionSettings;

public class UpsertDatabaseConnectionSettingsCommand : ICommand<string>, IWebRequest
{
    public bool UseDatabaseConnection { get; set; }
    public string Server { get; set; } = "localhost";
    public int? Port { get; set; }
    public string Database { get; set; } = string.Empty;
    public string UserId { get; set; } = string.Empty;
    public string? Password { get; set; }
    public bool TrustServerCertificate { get; set; } = true;
    public bool MultipleActiveResultSets { get; set; } = true;
    public string Path => "/api/Service/DatabaseConnectionSettings/Upsert";
}
