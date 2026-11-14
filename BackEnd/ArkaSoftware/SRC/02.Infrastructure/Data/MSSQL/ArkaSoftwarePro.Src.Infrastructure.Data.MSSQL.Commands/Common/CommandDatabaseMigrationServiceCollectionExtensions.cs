using Microsoft.Extensions.DependencyInjection;

namespace ArkaSoftwarePro.Src.Infrastructure.Data.MSSQL.Commands.Common;

public static class CommandDatabaseMigrationServiceCollectionExtensions
{
    /// <summary>
    /// Registers a hosted service that applies pending EF migrations for the command DbContext on startup.
    /// Controlled by configuration <see cref="CommandDatabaseAutoMigrationHostedService.ApplyMigrationsConfigurationKey"/> (default: true).
    /// </summary>
    public static IServiceCollection AddArkaSoftwareCommandDatabaseMigrateOnStartup(this IServiceCollection services)
    {
        services.AddHostedService<CommandDatabaseAutoMigrationHostedService>();
        return services;
    }
}
