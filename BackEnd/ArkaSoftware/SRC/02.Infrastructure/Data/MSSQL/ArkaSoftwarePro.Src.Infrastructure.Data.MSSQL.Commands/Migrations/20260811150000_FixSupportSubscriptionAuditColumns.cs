using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;
using ArkaSoftwarePro.Src.Infrastructure.Data.MSSQL.Commands.Common;

#nullable disable

namespace ArkaSoftwarePro.Src.Infrastructure.Data.MSSQL.Commands.Migrations;

/// <summary>
/// Aligns Support subscription audit columns with Framework shadow properties (nvarchar(50), not bigint).
/// </summary>
[DbContext(typeof(ArkaSoftwareCommandDbContext))]
[Migration("20260811150000_FixSupportSubscriptionAuditColumns")]
public partial class FixSupportSubscriptionAuditColumns : Migration
{
    private static readonly string[] Tables =
    [
        "SupportPlanTariffs",
        "StudentSupportSubscriptions",
        "StudentSupportFreezeRecords",
    ];

    protected override void Up(MigrationBuilder migrationBuilder)
    {
        foreach (var table in Tables)
        {
            migrationBuilder.Sql($"""
                IF OBJECT_ID(N'[Support].[{table}]', N'U') IS NOT NULL
                BEGIN
                    IF COL_LENGTH('Support.{table}', 'CreatedByUserId') IS NOT NULL
                        ALTER TABLE [Support].[{table}] ALTER COLUMN [CreatedByUserId] nvarchar(50) NULL;

                    IF COL_LENGTH('Support.{table}', 'ModifiedByUserId') IS NOT NULL
                        ALTER TABLE [Support].[{table}] ALTER COLUMN [ModifiedByUserId] nvarchar(50) NULL;
                END
                """);
        }
    }

    protected override void Down(MigrationBuilder migrationBuilder)
    {
        foreach (var table in Tables)
        {
            migrationBuilder.Sql($"""
                IF OBJECT_ID(N'[Support].[{table}]', N'U') IS NOT NULL
                BEGIN
                    IF COL_LENGTH('Support.{table}', 'CreatedByUserId') IS NOT NULL
                        ALTER TABLE [Support].[{table}] ALTER COLUMN [CreatedByUserId] bigint NULL;

                    IF COL_LENGTH('Support.{table}', 'ModifiedByUserId') IS NOT NULL
                        ALTER TABLE [Support].[{table}] ALTER COLUMN [ModifiedByUserId] bigint NULL;
                END
                """);
        }
    }
}
