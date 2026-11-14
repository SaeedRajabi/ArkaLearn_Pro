using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;
using ArkaSoftwarePro.Src.Infrastructure.Data.MSSQL.Commands.Common;

#nullable disable

namespace ArkaSoftwarePro.Src.Infrastructure.Data.MSSQL.Commands.Migrations;

/// <summary>
/// Align Desktop soft-delete columns to IsDeleted (EF maps AggregateRoot.IsDelete → IsDeleted).
/// </summary>
[DbContext(typeof(ArkaSoftwareCommandDbContext))]
[Migration("20261016120000_FixDesktopIsDeletedColumns")]
public partial class FixDesktopIsDeletedColumns : Migration
{
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.Sql("""
IF NOT EXISTS (SELECT 1 FROM sys.schemas WHERE name = N'Desktop')
    EXEC(N'CREATE SCHEMA [Desktop]');

DECLARE @tables TABLE (TableName sysname PRIMARY KEY);
INSERT INTO @tables (TableName) VALUES
    (N'DesktopAppLicenses'),
    (N'OfflinePlaybackGrants'),
    (N'DesktopDeviceRegistrations'),
    (N'DesktopAccessBlocks'),
    (N'RemoteAssistSessions'),
    (N'DesktopAppReleases'),
    (N'MediaContentKeys');

DECLARE @table sysname;
DECLARE @full nvarchar(300);
DECLARE @sql nvarchar(max);

DECLARE cur CURSOR LOCAL FAST_FORWARD FOR SELECT TableName FROM @tables;
OPEN cur;
FETCH NEXT FROM cur INTO @table;

WHILE @@FETCH_STATUS = 0
BEGIN
    SET @full = N'Desktop.' + @table;

    IF OBJECT_ID(@full, N'U') IS NOT NULL
    BEGIN
        IF COL_LENGTH(@full, N'IsDeleted') IS NULL AND COL_LENGTH(@full, N'IsDelete') IS NOT NULL
        BEGIN
            SET @sql = N'EXEC sp_rename N''' + @full + N'.IsDelete'', N''IsDeleted'', N''COLUMN'';';
            EXEC(@sql);
        END
        ELSE IF COL_LENGTH(@full, N'IsDeleted') IS NULL AND COL_LENGTH(@full, N'IsDelete') IS NULL
        BEGIN
            SET @sql = N'ALTER TABLE [Desktop].[' + @table + N']
                ADD [IsDeleted] bit NOT NULL CONSTRAINT [DF_' + @table + N'_IsDeleted] DEFAULT (0);';
            EXEC(@sql);
        END
    END

    FETCH NEXT FROM cur INTO @table;
END

CLOSE cur;
DEALLOCATE cur;
""");
    }

    protected override void Down(MigrationBuilder migrationBuilder)
    {
        // No-op: renaming back risks breaking DBs that never had IsDelete.
    }
}
