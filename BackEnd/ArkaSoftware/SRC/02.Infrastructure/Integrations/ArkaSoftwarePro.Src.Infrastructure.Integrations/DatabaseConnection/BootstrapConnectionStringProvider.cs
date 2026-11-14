using ArkaSoftwarePro.Src.Core.Contracts.DatabaseConnection;
using Microsoft.Extensions.Configuration;

namespace ArkaSoftwarePro.Src.Infrastructure.Integrations.DatabaseConnection;

public sealed class BootstrapConnectionStringProvider(IConfiguration configuration) : IBootstrapConnectionStringProvider
{
    public string GetConnectionString()
    {
        var fromEnv = Environment.GetEnvironmentVariable("ARKALEARN_BOOTSTRAP_CONNECTION");
        if (!string.IsNullOrWhiteSpace(fromEnv))
            return fromEnv.Trim();

        return configuration.GetConnectionString("BootstrapDB")
            ?? configuration.GetConnectionString("RemoteDB")
            ?? configuration.GetConnectionString("LocalDB")
            ?? throw new InvalidOperationException(
                "No bootstrap connection string found. Set ConnectionStrings:BootstrapDB or ARKALEARN_BOOTSTRAP_CONNECTION.");
    }
}
