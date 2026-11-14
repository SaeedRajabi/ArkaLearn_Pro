using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;
using ArkaSoftwarePro.Src.Infrastructure.Data.MSSQL.Commands.Common;

#nullable disable

namespace ArkaSoftwarePro.Src.Infrastructure.Data.MSSQL.Commands.Migrations;

/// <summary>
/// Converts Teacher advertisement monetization audit columns from bigint to nvarchar(50)
/// when legacy schemas still use numeric user ids. EF maps these as string shadow properties.
/// </summary>
[DbContext(typeof(ArkaSoftwareCommandDbContext))]
[Migration("20260909140000_EnsureAdvertisementMonetizationAuditColumns")]
public partial class EnsureAdvertisementMonetizationAuditColumns : Migration
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
        // Intentionally empty — reverting would re-break EF mappings.
    }
}
