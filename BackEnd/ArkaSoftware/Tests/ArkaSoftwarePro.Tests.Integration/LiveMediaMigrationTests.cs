using ArkaSoftwarePro.Src.Infrastructure.Data.MSSQL.Commands.Common;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;
using Microsoft.EntityFrameworkCore.Migrations.Operations;
using Xunit;

namespace ArkaSoftwarePro.Tests.Integration;

public class LiveMediaMigrationTests
{
    [Fact]
    public void Repair_migration_is_discovered_and_repairs_the_table_and_turn_columns()
    {
        var options = new DbContextOptionsBuilder<ArkaSoftwareCommandDbContext>()
            .UseSqlServer("Server=localhost;Database=unused;Trusted_Connection=True;TrustServerCertificate=True")
            .Options;
        using var db = new ArkaSoftwareCommandDbContext(options);
        var migrations = db.GetService<IMigrationsAssembly>();
        const string migrationId = "20261114120000_RepairLiveMediaTransportSettings";
        Assert.Contains(migrationId, migrations.Migrations.Keys);
        var migration = migrations.CreateMigration(migrations.Migrations[migrationId], db.Database.ProviderName!);
        var sql = Assert.Single(migration.UpOperations.OfType<SqlOperation>()).Sql;
        Assert.Contains("OBJECT_ID(N'[Website].[LiveMediaTransportSettings]'", sql);
        Assert.Contains("CREATE TABLE [Website].[LiveMediaTransportSettings]", sql);
        foreach (var column in new[] { "TurnUrl", "TurnUsername", "TurnPasswordEncrypted", "StunUrls" })
            Assert.Contains($"COL_LENGTH(N'Website.LiveMediaTransportSettings', N'{column}') IS NULL", sql);
        Assert.Empty(migration.DownOperations);
    }
}