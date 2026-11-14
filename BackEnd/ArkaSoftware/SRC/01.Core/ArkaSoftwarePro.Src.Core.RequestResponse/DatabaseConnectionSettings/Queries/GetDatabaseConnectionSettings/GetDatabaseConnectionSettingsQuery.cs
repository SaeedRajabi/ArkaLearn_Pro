using Framework.Src.Core.RequestResponse.Endpoints;
using Framework.Src.Core.RequestResponse.Queries;

namespace ArkaSoftwarePro.Src.Core.RequestResponse.DatabaseConnectionSettings.Queries.GetDatabaseConnectionSettings;

public class GetDatabaseConnectionSettingsQuery : IQuery<DatabaseConnectionSettingsQri>, IWebRequest
{
    public string Path => "/api/Service/DatabaseConnectionSettings/Get";
}

public sealed class DatabaseConnectionSettingsQri
{
    public bool UseDatabaseConnection { get; set; }
    public string Server { get; set; } = "localhost";
    public int? Port { get; set; }
    public string Database { get; set; } = string.Empty;
    public string UserId { get; set; } = string.Empty;
    public bool HasPassword { get; set; }
    public bool TrustServerCertificate { get; set; } = true;
    public bool MultipleActiveResultSets { get; set; } = true;
    public string BootstrapSource { get; set; } = "BootstrapDB";
}
