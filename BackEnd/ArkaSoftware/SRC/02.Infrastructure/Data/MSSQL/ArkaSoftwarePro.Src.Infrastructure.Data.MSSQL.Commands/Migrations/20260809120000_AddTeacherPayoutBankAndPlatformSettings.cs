using Microsoft.EntityFrameworkCore.Migrations;
using Microsoft.EntityFrameworkCore.Infrastructure;

#nullable disable

using ArkaSoftwarePro.Src.Infrastructure.Data.MSSQL.Commands.Common;

namespace ArkaSoftwarePro.Src.Infrastructure.Data.MSSQL.Commands.Migrations;

[DbContext(typeof(ArkaSoftwareCommandDbContext))]
[Migration("20260809120000_AddTeacherPayoutBankAndPlatformSettings")]
public partial class AddTeacherPayoutBankAndPlatformSettings : Migration
{
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.AddColumn<string>(
            name: "PayoutSheba",
            schema: "Teacher",
            table: "Teachers",
            type: "nvarchar(26)",
            maxLength: 26,
            nullable: true);

        migrationBuilder.AddColumn<string>(
            name: "PayoutCardNumber",
            schema: "Teacher",
            table: "Teachers",
            type: "nvarchar(16)",
            maxLength: 16,
            nullable: true);

        migrationBuilder.AddColumn<string>(
            name: "ZarinPalBankAccountId",
            schema: "Teacher",
            table: "Teachers",
            type: "nvarchar(64)",
            maxLength: 64,
            nullable: true);

        migrationBuilder.AddColumn<string>(
            name: "PlatformPayoutSheba",
            schema: "Finance",
            table: "PlatformFinanceSettings",
            type: "nvarchar(26)",
            maxLength: 26,
            nullable: true);

        migrationBuilder.AddColumn<string>(
            name: "PlatformPayoutCardNumber",
            schema: "Finance",
            table: "PlatformFinanceSettings",
            type: "nvarchar(16)",
            maxLength: 16,
            nullable: true);

        migrationBuilder.AddColumn<string>(
            name: "ZarinPalPlatformBankAccountId",
            schema: "Finance",
            table: "PlatformFinanceSettings",
            type: "nvarchar(64)",
            maxLength: 64,
            nullable: true);
    }

    protected override void Down(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.DropColumn(name: "PayoutSheba", schema: "Teacher", table: "Teachers");
        migrationBuilder.DropColumn(name: "PayoutCardNumber", schema: "Teacher", table: "Teachers");
        migrationBuilder.DropColumn(name: "ZarinPalBankAccountId", schema: "Teacher", table: "Teachers");
        migrationBuilder.DropColumn(name: "PlatformPayoutSheba", schema: "Finance", table: "PlatformFinanceSettings");
        migrationBuilder.DropColumn(name: "PlatformPayoutCardNumber", schema: "Finance", table: "PlatformFinanceSettings");
        migrationBuilder.DropColumn(name: "ZarinPalPlatformBankAccountId", schema: "Finance", table: "PlatformFinanceSettings");
    }
}
