using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;
using ArkaSoftwarePro.Src.Infrastructure.Data.MSSQL.Commands.Common;

#nullable disable

namespace ArkaSoftwarePro.Src.Infrastructure.Data.MSSQL.Commands.Migrations;

/// <summary>
/// Converts legacy bigint audit user-id columns to nvarchar(50) for advertisement monetization tables.
/// EF shadow properties map these fields as string; bigint columns cause InvalidCastException on read.
/// </summary>
[DbContext(typeof(ArkaSoftwareCommandDbContext))]
[Migration("20261009120000_ReconcileAdvertisementMonetizationAuditColumns")]
public partial class ReconcileAdvertisementMonetizationAuditColumns : Migration
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
                IF OBJECT_ID(N'[Teacher].[{table}]', N'U') IS NOT NULL
                BEGIN
                    IF EXISTS (
                        SELECT 1
                        FROM sys.columns c
                        INNER JOIN sys.types t ON c.user_type_id = t.user_type_id
                        WHERE c.object_id = OBJECT_ID(N'[Teacher].[{table}]')
                          AND c.name = N'CreatedByUserId'
                          AND t.name = N'bigint')
                    BEGIN
                        ALTER TABLE [Teacher].[{table}] ALTER COLUMN [CreatedByUserId] nvarchar(50) NULL;
                    END

                    IF EXISTS (
                        SELECT 1
                        FROM sys.columns c
                        INNER JOIN sys.types t ON c.user_type_id = t.user_type_id
                        WHERE c.object_id = OBJECT_ID(N'[Teacher].[{table}]')
                          AND c.name = N'ModifiedByUserId'
                          AND t.name = N'bigint')
                    BEGIN
                        ALTER TABLE [Teacher].[{table}] ALTER COLUMN [ModifiedByUserId] nvarchar(50) NULL;
                    END
                END
                """);
        }
    }

    protected override void Down(MigrationBuilder migrationBuilder)
    {
        // Intentionally empty — reverting would re-break EF string shadow mappings.
    }
}
