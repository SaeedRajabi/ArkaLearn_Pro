using Microsoft.EntityFrameworkCore.Migrations;
using Microsoft.EntityFrameworkCore.Infrastructure;

#nullable disable

using ArkaSoftwarePro.Src.Infrastructure.Data.MSSQL.Commands.Common;

namespace ArkaSoftwarePro.Src.Infrastructure.Data.MSSQL.Commands.Migrations;

[DbContext(typeof(ArkaSoftwareCommandDbContext))]
[Migration("20260812150000_AddPaymentGatewayAdminSettings")]
public partial class AddPaymentGatewayAdminSettings : Migration
{
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.AddColumn<bool>(
            name: "PaymentGatewayEnabled",
            schema: "Finance",
            table: "PlatformFinanceSettings",
            type: "bit",
            nullable: false,
            defaultValue: true);

        migrationBuilder.AddColumn<string>(
            name: "PaymentGatewayProvider",
            schema: "Finance",
            table: "PlatformFinanceSettings",
            type: "nvarchar(32)",
            maxLength: 32,
            nullable: false,
            defaultValue: "IdPay");
    }

    protected override void Down(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.DropColumn(name: "PaymentGatewayEnabled", schema: "Finance", table: "PlatformFinanceSettings");
        migrationBuilder.DropColumn(name: "PaymentGatewayProvider", schema: "Finance", table: "PlatformFinanceSettings");
    }
}
