using Microsoft.Data.SqlClient;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;

namespace ArkaSoftwarePro.Src.Infrastructure.Data.MSSQL.Commands.Common;

/// <summary>
/// Applies pending EF Core migrations for <see cref="ArkaSoftwareCommandDbContext"/> when the host starts.
/// New migration *classes* must still be added with tooling (e.g. dotnet ef migrations add); this only runs Migrate().
/// </summary>
public sealed class CommandDatabaseAutoMigrationHostedService(
    IServiceProvider serviceProvider,
    IConfiguration configuration,
    ILogger<CommandDatabaseAutoMigrationHostedService> logger) : IHostedService
{
    public const string ApplyMigrationsConfigurationKey = "Database:ApplyCommandMigrationsOnStartup";

    /// <summary>
    /// First table created by <c>CreateFirst</c>; used only to detect "schema exists but EF history is missing/out of sync".
    /// </summary>
    private const string ProbeSchema = "Website";

    private const string ProbeTable = "AboutUsPages";

    public async Task StartAsync(CancellationToken cancellationToken)
    {
        if (!configuration.GetValue(ApplyMigrationsConfigurationKey, true))
        {
            logger.LogInformation(
                "Skipping command database migrations ({Key}=false).",
                ApplyMigrationsConfigurationKey);
            return;
        }

        using var scope = serviceProvider.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<ArkaSoftwareCommandDbContext>();

        var allMigrationIds = db.Database.GetMigrations().ToList();
        var pendingList = (await db.Database.GetPendingMigrationsAsync(cancellationToken).ConfigureAwait(false)).ToList();

        if (pendingList.Count == 0)
        {
            logger.LogInformation("Command database schema already up to date (no pending migrations).");
            return;
        }

        logger.LogInformation(
            "Applying {Count} pending command database migration(s): {Migrations}",
            pendingList.Count,
            string.Join(", ", pendingList));

        await AssertNotInitialMigrationReplayOnExistingSchemaAsync(
                db, allMigrationIds, pendingList, logger, cancellationToken)
            .ConfigureAwait(false);

        try
        {
            await db.Database.MigrateAsync(cancellationToken).ConfigureAwait(false);
        }
        catch (SqlException ex) when (ex.Number is 2714 or 1913)
        {
            // 2714: object already exists; 1913: duplicate operation (older / edge cases)
            logger.LogCritical(
                ex,
                "EF migration failed because a database object already exists. The command catalog and __EFMigrationsHistory are likely out of sync.");
            throw CreateHistoryMismatchException(allMigrationIds, ex);
        }

        logger.LogInformation("Command database migrations applied successfully.");
    }

    public Task StopAsync(CancellationToken cancellationToken) => Task.CompletedTask;

    private static async Task AssertNotInitialMigrationReplayOnExistingSchemaAsync(
        ArkaSoftwareCommandDbContext db,
        IReadOnlyList<string> allMigrationIds,
        IReadOnlyList<string> pendingList,
        ILogger logger,
        CancellationToken cancellationToken)
    {
        if (allMigrationIds.Count == 0 || pendingList.Count == 0)
            return;

        var firstEver = allMigrationIds[0];
        var nextToApply = pendingList[0];
        if (!string.Equals(nextToApply, firstEver, StringComparison.Ordinal))
            return;

        if (!await ProbeTableExistsAsync(db, cancellationToken).ConfigureAwait(false))
            return;

        var ex = CreateHistoryMismatchException(allMigrationIds, inner: null);
        logger.LogCritical(ex, "Command database migration preflight failed: initial migration is pending but {Schema}.{Table} already exists.", ProbeSchema, ProbeTable);
        throw ex;
    }

    private static async Task<bool> ProbeTableExistsAsync(
        ArkaSoftwareCommandDbContext db,
        CancellationToken cancellationToken)
    {
        await db.Database.OpenConnectionAsync(cancellationToken).ConfigureAwait(false);
        try
        {
            await using var cmd = db.Database.GetDbConnection().CreateCommand();
            cmd.CommandText = """
                SELECT 1
                FROM INFORMATION_SCHEMA.TABLES
                WHERE TABLE_SCHEMA = @schema AND TABLE_NAME = @name
                """;
            var p0 = cmd.CreateParameter();
            p0.ParameterName = "@schema";
            p0.Value = ProbeSchema;
            cmd.Parameters.Add(p0);
            var p1 = cmd.CreateParameter();
            p1.ParameterName = "@name";
            p1.Value = ProbeTable;
            cmd.Parameters.Add(p1);

            var scalar = await cmd.ExecuteScalarAsync(cancellationToken).ConfigureAwait(false);
            return scalar != null && !Equals(scalar, DBNull.Value);
        }
        finally
        {
            await db.Database.CloseConnectionAsync().ConfigureAwait(false);
        }
    }

    private static InvalidOperationException CreateHistoryMismatchException(
        IReadOnlyList<string> allMigrationIds,
        Exception? inner)
    {
        // Must match the ProductVersion recorded in generated migration designers (see Migrations/*.Designer.cs).
        const string productVersion = "9.0.3";

        var inserts = string.Join(
            Environment.NewLine,
            allMigrationIds.Select(id => $"INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion]) VALUES (N'{id}', N'{productVersion}');"));

        var message =
            "The database already contains command tables (for example Website.AboutUsPages), but EF Core still has pending migrations starting from the first migration. " +
            "That usually means __EFMigrationsHistory is missing or was cleared while the schema remained. " +
            "Automatic Migrate() cannot run safely in that state. " +
            "Fix options: (1) Restore __EFMigrationsHistory from a backup that matches this database, or (2) insert rows only for migrations that truly match the physical schema (see example below), or (3) set Database:ApplyCommandMigrationsOnStartup to false until the database is repaired, or (4) use a new empty database. " +
            "Do not insert history for migrations that were never applied to this database." +
            Environment.NewLine +
            "Example SQL (verify each migration matches your DB before running):" +
            Environment.NewLine +
            inserts;

        return new InvalidOperationException(message, inner);
    }
}
