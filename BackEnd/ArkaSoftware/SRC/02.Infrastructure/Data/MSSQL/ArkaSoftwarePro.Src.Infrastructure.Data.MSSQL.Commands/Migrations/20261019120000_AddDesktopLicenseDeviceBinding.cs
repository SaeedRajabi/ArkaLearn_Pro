using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;
using ArkaSoftwarePro.Src.Infrastructure.Data.MSSQL.Commands.Common;

#nullable disable

namespace ArkaSoftwarePro.Src.Infrastructure.Data.MSSQL.Commands.Migrations;

[DbContext(typeof(ArkaSoftwareCommandDbContext))]
[Migration("20261019120000_AddDesktopLicenseDeviceBinding")]
public partial class AddDesktopLicenseDeviceBinding : Migration
{
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.Sql("""
IF OBJECT_ID(N'[Enrollment].[Enrollments]', N'U') IS NOT NULL
BEGIN
    IF COL_LENGTH(N'Enrollment.Enrollments', N'DesktopLicenseBoundDeviceId') IS NULL
        ALTER TABLE [Enrollment].[Enrollments]
            ADD [DesktopLicenseBoundDeviceId] nvarchar(128) NULL;
END
""");
    }

    protected override void Down(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.Sql("""
IF COL_LENGTH(N'Enrollment.Enrollments', N'DesktopLicenseBoundDeviceId') IS NOT NULL
    ALTER TABLE [Enrollment].[Enrollments] DROP COLUMN [DesktopLicenseBoundDeviceId];
""");
    }
}
