using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;
using ArkaSoftwarePro.Src.Infrastructure.Data.MSSQL.Commands.Common;

#nullable disable

namespace ArkaSoftwarePro.Src.Infrastructure.Data.MSSQL.Commands.Migrations;

[DbContext(typeof(ArkaSoftwareCommandDbContext))]
[Migration("20261017120000_AddDesktopLicenseManagement")]
public partial class AddDesktopLicenseManagement : Migration
{
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.Sql("""
IF OBJECT_ID(N'[Enrollment].[Enrollments]', N'U') IS NOT NULL
BEGIN
    IF COL_LENGTH(N'Enrollment.Enrollments', N'IsDesktopLicenseActive') IS NULL
        ALTER TABLE [Enrollment].[Enrollments]
            ADD [IsDesktopLicenseActive] bit NOT NULL CONSTRAINT [DF_Enrollments_IsDesktopLicenseActive] DEFAULT (1);

    IF COL_LENGTH(N'Enrollment.Enrollments', N'DesktopLicenseExpiresAtUtc') IS NULL
        ALTER TABLE [Enrollment].[Enrollments]
            ADD [DesktopLicenseExpiresAtUtc] datetime2 NULL;
END
""");
    }

    protected override void Down(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.Sql("""
IF COL_LENGTH(N'Enrollment.Enrollments', N'DesktopLicenseExpiresAtUtc') IS NOT NULL
    ALTER TABLE [Enrollment].[Enrollments] DROP COLUMN [DesktopLicenseExpiresAtUtc];

IF COL_LENGTH(N'Enrollment.Enrollments', N'IsDesktopLicenseActive') IS NOT NULL
BEGIN
    IF OBJECT_ID(N'[Enrollment].[Enrollments].[DF_Enrollments_IsDesktopLicenseActive]', N'D') IS NOT NULL
        ALTER TABLE [Enrollment].[Enrollments] DROP CONSTRAINT [DF_Enrollments_IsDesktopLicenseActive];
    ALTER TABLE [Enrollment].[Enrollments] DROP COLUMN [IsDesktopLicenseActive];
END
""");
    }
}
