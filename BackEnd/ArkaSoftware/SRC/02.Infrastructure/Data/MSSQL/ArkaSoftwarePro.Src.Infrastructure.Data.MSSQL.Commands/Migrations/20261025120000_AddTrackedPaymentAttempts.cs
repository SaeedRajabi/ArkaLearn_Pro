using ArkaSoftwarePro.Src.Infrastructure.Data.MSSQL.Commands.Common;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;

namespace ArkaSoftwarePro.Src.Infrastructure.Data.MSSQL.Commands.Migrations;

[DbContext(typeof(ArkaSoftwareCommandDbContext))]
[Migration("20261025120000_AddTrackedPaymentAttempts")]
public sealed class AddTrackedPaymentAttempts : Migration
{
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.EnsureSchema("Finance");
        migrationBuilder.CreateTable("PaymentAttempts", schema: "Finance", columns: table => new
        {
            OrderId = table.Column<string>(maxLength: 200, nullable: false),
            Provider = table.Column<string>(maxLength: 32, nullable: false),
            PaymentId = table.Column<string>(maxLength: 200, nullable: true),
            ExpectedAmount = table.Column<long>(nullable: false),
            AmountMultiplier = table.Column<int>(nullable: false),
            TargetType = table.Column<int>(nullable: false),
            TargetId = table.Column<long>(nullable: false),
            UserId = table.Column<long>(nullable: false),
            CreatedUtc = table.Column<DateTime>(nullable: false),
            ExpiresUtc = table.Column<DateTime>(nullable: false),
            Status = table.Column<int>(nullable: false),
            LeaseId = table.Column<Guid>(nullable: true),
            LeaseExpiresUtc = table.Column<DateTime>(nullable: true),
            ReferenceNumber = table.Column<string>(maxLength: 200, nullable: true),
            CardNumber = table.Column<string>(maxLength: 100, nullable: true),
            ResultUrl = table.Column<string>(maxLength: 4000, nullable: true),
            CompletedUtc = table.Column<DateTime>(nullable: true)
        }, constraints: table => table.PrimaryKey("PK_PaymentAttempts", x => x.OrderId));
        migrationBuilder.CreateIndex("IX_PaymentAttempts_Provider_PaymentId", "PaymentAttempts", new[] { "Provider", "PaymentId" }, "Finance", unique: true, filter: "[PaymentId] IS NOT NULL");
        migrationBuilder.CreateIndex("IX_PaymentAttempts_Provider_ReferenceNumber", "PaymentAttempts", new[] { "Provider", "ReferenceNumber" }, "Finance", unique: true, filter: "[ReferenceNumber] IS NOT NULL");
    }

    protected override void Down(MigrationBuilder migrationBuilder) => migrationBuilder.DropTable("PaymentAttempts", "Finance");
}
