using Microsoft.EntityFrameworkCore.Migrations;
using Microsoft.EntityFrameworkCore.Infrastructure;

#nullable disable

using ArkaSoftwarePro.Src.Infrastructure.Data.MSSQL.Commands.Common;

namespace ArkaSoftwarePro.Src.Infrastructure.Data.MSSQL.Commands.Migrations;

[DbContext(typeof(ArkaSoftwareCommandDbContext))]
[Migration("20260714120000_AddPaymentGatewayEncryptedCredentials")]
public partial class AddPaymentGatewayEncryptedCredentials : Migration
{
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.AddColumn<string>(
            name: "ZibalMerchantIdEncrypted",
            schema: "Finance",
            table: "PlatformFinanceSettings",
            type: "nvarchar(512)",
            maxLength: 512,
            nullable: true);

        migrationBuilder.AddColumn<string>(
            name: "ZibalApiKeyEncrypted",
            schema: "Finance",
            table: "PlatformFinanceSettings",
            type: "nvarchar(512)",
            maxLength: 512,
            nullable: true);

        migrationBuilder.AddColumn<string>(
            name: "ZibalAccessTokenEncrypted",
            schema: "Finance",
            table: "PlatformFinanceSettings",
            type: "nvarchar(512)",
            maxLength: 512,
            nullable: true);

        migrationBuilder.AddColumn<bool>(
            name: "ZibalUseSandbox",
            schema: "Finance",
            table: "PlatformFinanceSettings",
            type: "bit",
            nullable: false,
            defaultValue: false);

        migrationBuilder.AddColumn<string>(
            name: "ZarinPalMerchantIdEncrypted",
            schema: "Finance",
            table: "PlatformFinanceSettings",
            type: "nvarchar(512)",
            maxLength: 512,
            nullable: true);

        migrationBuilder.AddColumn<string>(
            name: "ZarinPalAccessTokenEncrypted",
            schema: "Finance",
            table: "PlatformFinanceSettings",
            type: "nvarchar(512)",
            maxLength: 512,
            nullable: true);

        migrationBuilder.AddColumn<string>(
            name: "ZarinPalTerminalIdEncrypted",
            schema: "Finance",
            table: "PlatformFinanceSettings",
            type: "nvarchar(512)",
            maxLength: 512,
            nullable: true);

        migrationBuilder.AddColumn<bool>(
            name: "ZarinPalUseSandbox",
            schema: "Finance",
            table: "PlatformFinanceSettings",
            type: "bit",
            nullable: false,
            defaultValue: false);
    }

    protected override void Down(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.DropColumn(name: "ZibalMerchantIdEncrypted", schema: "Finance", table: "PlatformFinanceSettings");
        migrationBuilder.DropColumn(name: "ZibalApiKeyEncrypted", schema: "Finance", table: "PlatformFinanceSettings");
        migrationBuilder.DropColumn(name: "ZibalAccessTokenEncrypted", schema: "Finance", table: "PlatformFinanceSettings");
        migrationBuilder.DropColumn(name: "ZibalUseSandbox", schema: "Finance", table: "PlatformFinanceSettings");
        migrationBuilder.DropColumn(name: "ZarinPalMerchantIdEncrypted", schema: "Finance", table: "PlatformFinanceSettings");
        migrationBuilder.DropColumn(name: "ZarinPalAccessTokenEncrypted", schema: "Finance", table: "PlatformFinanceSettings");
        migrationBuilder.DropColumn(name: "ZarinPalTerminalIdEncrypted", schema: "Finance", table: "PlatformFinanceSettings");
        migrationBuilder.DropColumn(name: "ZarinPalUseSandbox", schema: "Finance", table: "PlatformFinanceSettings");
    }
}
