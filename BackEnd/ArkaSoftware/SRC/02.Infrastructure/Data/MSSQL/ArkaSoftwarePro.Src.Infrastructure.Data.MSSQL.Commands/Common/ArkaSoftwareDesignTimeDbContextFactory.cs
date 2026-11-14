using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Design;

namespace ArkaSoftwarePro.Src.Infrastructure.Data.MSSQL.Commands.Common;

/// <summary>EF tooling never starts the API or its background workers.</summary>
public sealed class ArkaSoftwareDesignTimeDbContextFactory : IDesignTimeDbContextFactory<ArkaSoftwareCommandDbContext>
{
    public ArkaSoftwareCommandDbContext CreateDbContext(string[] args)
    {
        var connection = Environment.GetEnvironmentVariable("ARKALEARN_MIGRATION_CONNECTION");
        if (string.IsNullOrWhiteSpace(connection))
            throw new InvalidOperationException("Set ARKALEARN_MIGRATION_CONNECTION explicitly for EF tooling. API configuration is not used.");
        return new ArkaSoftwareCommandDbContext(new DbContextOptionsBuilder<ArkaSoftwareCommandDbContext>()
            .UseSqlServer(connection).Options);
    }
}
