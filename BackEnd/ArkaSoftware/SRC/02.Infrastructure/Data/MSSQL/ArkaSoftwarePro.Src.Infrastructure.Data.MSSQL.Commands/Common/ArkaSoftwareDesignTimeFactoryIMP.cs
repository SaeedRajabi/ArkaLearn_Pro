using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Design;
using Microsoft.EntityFrameworkCore.Diagnostics;
using Microsoft.Extensions.Configuration;

namespace ArkaSoftwarePro.Src.Infrastructure.Data.MSSQL.Commands.Common
{
    public class ArkaSoftwareDesignTimeFactoryIMP : IDesignTimeDbContextFactory<ArkaSoftwareCommandDbContext>
    {
        public ArkaSoftwareCommandDbContext CreateDbContext(string[] args)
        {
            var apiRoot = Path.GetFullPath(Path.Combine(Directory.GetCurrentDirectory(), "..", "..", "..", "..", "..", "03.Endpoints", "ArkaSoftwarePro.Src.Endpoints.API"));
            if (!Directory.Exists(apiRoot))
                apiRoot = Directory.GetCurrentDirectory();

            IConfigurationRoot configuration = new ConfigurationBuilder()
                .SetBasePath(apiRoot)
                .AddJsonFile("appsettings.json", optional: true)
                .AddJsonFile("appsettings.Development.json", optional: true)
                .Build();

            var connectionString = configuration.GetConnectionString("BootstrapDB")
                ?? configuration.GetConnectionString("LocalDB")
                ?? configuration.GetConnectionString("RemoteDB")
                ?? throw new InvalidOperationException("No BootstrapDB, LocalDB or RemoteDB connection string found.");

            var optionBuilder = new DbContextOptionsBuilder<ArkaSoftwareCommandDbContext>();
            optionBuilder
                .ConfigureWarnings(w => w.Ignore(RelationalEventId.PendingModelChangesWarning))
                .UseSqlServer(connectionString);
            return new ArkaSoftwareCommandDbContext(optionBuilder.Options);
        }
    }
}
