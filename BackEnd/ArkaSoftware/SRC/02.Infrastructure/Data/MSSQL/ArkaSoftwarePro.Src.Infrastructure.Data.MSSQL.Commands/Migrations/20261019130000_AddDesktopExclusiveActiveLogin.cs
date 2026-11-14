using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;
using ArkaSoftwarePro.Src.Infrastructure.Data.MSSQL.Commands.Common;

#nullable disable

namespace ArkaSoftwarePro.Src.Infrastructure.Data.MSSQL.Commands.Migrations;

[DbContext(typeof(ArkaSoftwareCommandDbContext))]
[Migration("20261019130000_AddDesktopExclusiveActiveLogin")]
public partial class AddDesktopExclusiveActiveLogin : Migration
{
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.Sql("""
IF OBJECT_ID(N'[Desktop].[DesktopDeviceRegistrations]', N'U') IS NOT NULL
BEGIN
    IF COL_LENGTH(N'Desktop.DesktopDeviceRegistrations', N'HasActiveLogin') IS NULL
        ALTER TABLE [Desktop].[DesktopDeviceRegistrations]
            ADD [HasActiveLogin] bit NOT NULL
                CONSTRAINT [DF_DesktopDeviceRegistrations_HasActiveLogin] DEFAULT (0);

    IF COL_LENGTH(N'Desktop.DesktopDeviceRegistrations', N'ActiveLoginAtUtc') IS NULL
        ALTER TABLE [Desktop].[DesktopDeviceRegistrations]
            ADD [ActiveLoginAtUtc] datetime2 NULL;

    IF NOT EXISTS (
        SELECT 1 FROM sys.indexes
        WHERE name = N'IX_DesktopDeviceRegistrations_UserId_HasActiveLogin'
          AND object_id = OBJECT_ID(N'[Desktop].[DesktopDeviceRegistrations]'))
    BEGIN
        CREATE INDEX [IX_DesktopDeviceRegistrations_UserId_HasActiveLogin]
            ON [Desktop].[DesktopDeviceRegistrations] ([UserId], [HasActiveLogin]);
    END
END
""");
    }

    protected override void Down(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.Sql("""
IF EXISTS (
    SELECT 1 FROM sys.indexes
    WHERE name = N'IX_DesktopDeviceRegistrations_UserId_HasActiveLogin'
      AND object_id = OBJECT_ID(N'[Desktop].[DesktopDeviceRegistrations]'))
    DROP INDEX [IX_DesktopDeviceRegistrations_UserId_HasActiveLogin]
        ON [Desktop].[DesktopDeviceRegistrations];

IF COL_LENGTH(N'Desktop.DesktopDeviceRegistrations', N'ActiveLoginAtUtc') IS NOT NULL
    ALTER TABLE [Desktop].[DesktopDeviceRegistrations] DROP COLUMN [ActiveLoginAtUtc];

IF COL_LENGTH(N'Desktop.DesktopDeviceRegistrations', N'HasActiveLogin') IS NOT NULL
BEGIN
    IF OBJECT_ID(N'[Desktop].[DF_DesktopDeviceRegistrations_HasActiveLogin]', N'D') IS NOT NULL
        ALTER TABLE [Desktop].[DesktopDeviceRegistrations]
            DROP CONSTRAINT [DF_DesktopDeviceRegistrations_HasActiveLogin];
    ALTER TABLE [Desktop].[DesktopDeviceRegistrations] DROP COLUMN [HasActiveLogin];
END
""");
    }
}
