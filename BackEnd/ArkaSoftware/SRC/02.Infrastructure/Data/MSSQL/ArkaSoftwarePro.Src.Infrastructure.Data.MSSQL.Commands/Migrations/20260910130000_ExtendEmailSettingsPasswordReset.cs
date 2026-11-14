using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;
using ArkaSoftwarePro.Src.Infrastructure.Data.MSSQL.Commands.Common;

#nullable disable

namespace ArkaSoftwarePro.Src.Infrastructure.Data.MSSQL.Commands.Migrations;

[DbContext(typeof(ArkaSoftwareCommandDbContext))]
[Migration("20260910130000_ExtendEmailSettingsPasswordReset")]
public partial class ExtendEmailSettingsPasswordReset : Migration
{
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.Sql("""
            IF OBJECT_ID(N'[Website].[EmailSettings]', N'U') IS NOT NULL
            BEGIN
                IF COL_LENGTH('Website.EmailSettings', 'PasswordResetLinkExpiryMinutes') IS NULL
                    ALTER TABLE [Website].[EmailSettings]
                        ADD [PasswordResetLinkExpiryMinutes] int NOT NULL
                        CONSTRAINT [DF_EmailSettings_PasswordResetLinkExpiryMinutes] DEFAULT(15);

                IF COL_LENGTH('Website.EmailSettings', 'PasswordChangeUseSms') IS NULL
                    ALTER TABLE [Website].[EmailSettings]
                        ADD [PasswordChangeUseSms] bit NOT NULL
                        CONSTRAINT [DF_EmailSettings_PasswordChangeUseSms] DEFAULT(0);
            END
            """);
    }

    protected override void Down(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.Sql("""
            IF OBJECT_ID(N'[Website].[EmailSettings]', N'U') IS NOT NULL
            BEGIN
                IF COL_LENGTH('Website.EmailSettings', 'PasswordResetLinkExpiryMinutes') IS NOT NULL
                BEGIN
                    DECLARE @df1 sysname;
                    SELECT @df1 = dc.name
                    FROM sys.default_constraints dc
                    JOIN sys.columns c ON dc.parent_object_id = c.object_id AND dc.parent_column_id = c.column_id
                    WHERE dc.parent_object_id = OBJECT_ID(N'[Website].[EmailSettings]')
                      AND c.name = N'PasswordResetLinkExpiryMinutes';
                    IF @df1 IS NOT NULL EXEC(N'ALTER TABLE [Website].[EmailSettings] DROP CONSTRAINT [' + @df1 + N']');
                    ALTER TABLE [Website].[EmailSettings] DROP COLUMN [PasswordResetLinkExpiryMinutes];
                END

                IF COL_LENGTH('Website.EmailSettings', 'PasswordChangeUseSms') IS NOT NULL
                BEGIN
                    DECLARE @df2 sysname;
                    SELECT @df2 = dc.name
                    FROM sys.default_constraints dc
                    JOIN sys.columns c ON dc.parent_object_id = c.object_id AND dc.parent_column_id = c.column_id
                    WHERE dc.parent_object_id = OBJECT_ID(N'[Website].[EmailSettings]')
                      AND c.name = N'PasswordChangeUseSms';
                    IF @df2 IS NOT NULL EXEC(N'ALTER TABLE [Website].[EmailSettings] DROP CONSTRAINT [' + @df2 + N']');
                    ALTER TABLE [Website].[EmailSettings] DROP COLUMN [PasswordChangeUseSms];
                END
            END
            """);
    }
}
