using Microsoft.EntityFrameworkCore.Migrations;
using Microsoft.EntityFrameworkCore.Infrastructure;

#nullable disable

using ArkaSoftwarePro.Src.Infrastructure.Data.MSSQL.Commands.Common;

namespace ArkaSoftwarePro.Src.Infrastructure.Data.MSSQL.Commands.Migrations;

[DbContext(typeof(ArkaSoftwareCommandDbContext))]
[Migration("20260813120000_AddUserWalletSystem")]
public partial class AddUserWalletSystem : Migration
{
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.AddColumn<string>(
            name: "ZibalSubMerchantId",
            schema: "Teacher",
            table: "Teachers",
            type: "nvarchar(32)",
            maxLength: 32,
            nullable: true);

        migrationBuilder.CreateTable(
            name: "UserWallets",
            schema: "Finance",
            columns: table => new
            {
                Id = table.Column<long>(type: "bigint", nullable: false)
                    .Annotation("SqlServer:Identity", "1, 1"),
                UserId = table.Column<long>(type: "bigint", nullable: false),
                IsPlatformWallet = table.Column<bool>(type: "bit", nullable: false, defaultValue: false),
                AvailableBalanceToman = table.Column<long>(type: "bigint", nullable: false, defaultValue: 0L),
                ReservedBalanceToman = table.Column<long>(type: "bigint", nullable: false, defaultValue: 0L),
                TotalDepositedToman = table.Column<long>(type: "bigint", nullable: false, defaultValue: 0L),
                TotalSpentToman = table.Column<long>(type: "bigint", nullable: false, defaultValue: 0L),
                TotalReceivedToman = table.Column<long>(type: "bigint", nullable: false, defaultValue: 0L),
                TotalWithdrawnToman = table.Column<long>(type: "bigint", nullable: false, defaultValue: 0L),
                ZibalSubMerchantId = table.Column<string>(type: "nvarchar(32)", maxLength: 32, nullable: true),
                ZibalProvisionedAtUtc = table.Column<DateTime>(type: "datetime2", nullable: true),
                LastPayoutRequestedAtUtc = table.Column<DateTime>(type: "datetime2", nullable: true),
                IsSuspended = table.Column<bool>(type: "bit", nullable: false, defaultValue: false),
            },
            constraints: table => table.PrimaryKey("PK_UserWallets", x => x.Id));

        migrationBuilder.CreateIndex(
            name: "IX_UserWallets_UserId",
            schema: "Finance",
            table: "UserWallets",
            column: "UserId",
            unique: true);

        migrationBuilder.CreateTable(
            name: "WalletTransactions",
            schema: "Finance",
            columns: table => new
            {
                Id = table.Column<long>(type: "bigint", nullable: false)
                    .Annotation("SqlServer:Identity", "1, 1"),
                WalletId = table.Column<long>(type: "bigint", nullable: false),
                UserId = table.Column<long>(type: "bigint", nullable: false),
                Type = table.Column<int>(type: "int", nullable: false),
                AmountToman = table.Column<long>(type: "bigint", nullable: false),
                BalanceAfterToman = table.Column<long>(type: "bigint", nullable: false),
                Reference = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: false),
                Description = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: true),
                CounterpartyUserId = table.Column<long>(type: "bigint", nullable: true),
                CreatedAtUtc = table.Column<DateTime>(type: "datetime2", nullable: false),
            },
            constraints: table => table.PrimaryKey("PK_WalletTransactions", x => x.Id));

        migrationBuilder.CreateIndex(
            name: "IX_WalletTransactions_Reference",
            schema: "Finance",
            table: "WalletTransactions",
            column: "Reference",
            unique: true);

        migrationBuilder.CreateIndex(
            name: "IX_WalletTransactions_UserId_CreatedAtUtc",
            schema: "Finance",
            table: "WalletTransactions",
            columns: new[] { "UserId", "CreatedAtUtc" });

        migrationBuilder.Sql(
            """
            INSERT INTO [Finance].[UserWallets]
                ([UserId], [IsPlatformWallet], [AvailableBalanceToman], [ReservedBalanceToman],
                 [TotalDepositedToman], [TotalSpentToman], [TotalReceivedToman], [TotalWithdrawnToman], [IsSuspended])
            VALUES (0, 1, 0, 0, 0, 0, 0, 0, 0);
            """);
    }

    protected override void Down(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.DropTable(name: "WalletTransactions", schema: "Finance");
        migrationBuilder.DropTable(name: "UserWallets", schema: "Finance");
        migrationBuilder.DropColumn(name: "ZibalSubMerchantId", schema: "Teacher", table: "Teachers");
    }
}
