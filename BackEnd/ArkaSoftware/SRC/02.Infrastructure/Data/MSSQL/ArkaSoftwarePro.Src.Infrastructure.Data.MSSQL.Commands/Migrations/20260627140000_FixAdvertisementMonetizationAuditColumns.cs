using Microsoft.EntityFrameworkCore.Migrations;
using Microsoft.EntityFrameworkCore.Infrastructure;

#nullable disable

using ArkaSoftwarePro.Src.Infrastructure.Data.MSSQL.Commands.Common;

namespace ArkaSoftwarePro.Src.Infrastructure.Data.MSSQL.Commands.Migrations;

/// <summary>
/// Aligns audit columns with Framework shadow properties (nvarchar(50), not bigint).
/// </summary>
[DbContext(typeof(ArkaSoftwareCommandDbContext))]
[Migration("20260627140000_FixAdvertisementMonetizationAuditColumns")]
public partial class FixAdvertisementMonetizationAuditColumns : Migration
{
    private static readonly string[] Tables =
    [
        "AdvertisementMonetizationSettings",
        "AdvertisementTariffs",
        "AdvertisementSubscriptions",
        "AdvertisementContactUnlocks",
        "AdvertisementAutoBumpPackages",
        "AdvertisementAutoBumpPurchases",
        "AdvertisementMonetizationRevenues",
        "TeacherExperiencePointEvents",
    ];

    protected override void Up(MigrationBuilder migrationBuilder)
    {
        foreach (var table in Tables)
        {
            migrationBuilder.Sql($"""
                IF COL_LENGTH('Teacher.{table}', 'CreatedByUserId') IS NOT NULL
                BEGIN
                    ALTER TABLE [Teacher].[{table}] ALTER COLUMN [CreatedByUserId] nvarchar(50) NULL;
                END
                IF COL_LENGTH('Teacher.{table}', 'ModifiedByUserId') IS NOT NULL
                BEGIN
                    ALTER TABLE [Teacher].[{table}] ALTER COLUMN [ModifiedByUserId] nvarchar(50) NULL;
                END
                """);
        }
    }

    protected override void Down(MigrationBuilder migrationBuilder)
    {
        foreach (var table in Tables)
        {
            migrationBuilder.Sql($"""
                IF COL_LENGTH('Teacher.{table}', 'CreatedByUserId') IS NOT NULL
                BEGIN
                    ALTER TABLE [Teacher].[{table}] ALTER COLUMN [CreatedByUserId] bigint NULL;
                END
                IF COL_LENGTH('Teacher.{table}', 'ModifiedByUserId') IS NOT NULL
                BEGIN
                    ALTER TABLE [Teacher].[{table}] ALTER COLUMN [ModifiedByUserId] bigint NULL;
                END
                """);
        }
    }
}
