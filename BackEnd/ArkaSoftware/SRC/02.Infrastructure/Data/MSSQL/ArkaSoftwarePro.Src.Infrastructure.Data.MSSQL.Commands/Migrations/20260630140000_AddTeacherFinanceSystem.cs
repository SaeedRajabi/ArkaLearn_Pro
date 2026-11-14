using Microsoft.EntityFrameworkCore.Migrations;
using Microsoft.EntityFrameworkCore.Infrastructure;

#nullable disable

using ArkaSoftwarePro.Src.Infrastructure.Data.MSSQL.Commands.Common;

namespace ArkaSoftwarePro.Src.Infrastructure.Data.MSSQL.Commands.Migrations;

[DbContext(typeof(ArkaSoftwareCommandDbContext))]
[Migration("20260630140000_AddTeacherFinanceSystem")]
public partial class AddTeacherFinanceSystem : Migration
{
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.EnsureSchema(name: "Finance");

        migrationBuilder.CreateTable(
            name: "PlatformFinanceSettings",
            schema: "Finance",
            columns: table => new
            {
                Id = table.Column<long>(type: "bigint", nullable: false)
                    .Annotation("SqlServer:Identity", "1, 1"),
                IncomeTaxPercent = table.Column<decimal>(type: "decimal(5,2)", precision: 5, scale: 2, nullable: false),
                PayoutCooldownHours = table.Column<int>(type: "int", nullable: false),
                PlatformFeePercent = table.Column<decimal>(type: "decimal(5,2)", precision: 5, scale: 2, nullable: false),
                TotalCentralBalanceToman = table.Column<long>(type: "bigint", nullable: false),
                CreatedByUserId = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: true),
                CreatedDateTime = table.Column<DateTime>(type: "datetime2", nullable: false),
                ModifiedByUserId = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: true),
                ModifiedDateTime = table.Column<DateTime>(type: "datetime2", nullable: true),
                IsDelete = table.Column<bool>(type: "bit", nullable: false),
                BusinessId = table.Column<Guid>(type: "uniqueidentifier", nullable: false)
            },
            constraints: table => table.PrimaryKey("PK_PlatformFinanceSettings", x => x.Id));

        migrationBuilder.CreateTable(
            name: "TeacherWallets",
            schema: "Finance",
            columns: table => new
            {
                Id = table.Column<long>(type: "bigint", nullable: false)
                    .Annotation("SqlServer:Identity", "1, 1"),
                TeacherId = table.Column<long>(type: "bigint", nullable: false),
                AvailableBalanceToman = table.Column<long>(type: "bigint", nullable: false),
                ReservedBalanceToman = table.Column<long>(type: "bigint", nullable: false),
                TotalGrossSalesToman = table.Column<long>(type: "bigint", nullable: false),
                TotalTaxWithheldToman = table.Column<long>(type: "bigint", nullable: false),
                TotalPlatformFeeToman = table.Column<long>(type: "bigint", nullable: false),
                TotalNetEarnedToman = table.Column<long>(type: "bigint", nullable: false),
                TotalWithdrawnToman = table.Column<long>(type: "bigint", nullable: false),
                TotalSaleCount = table.Column<int>(type: "int", nullable: false),
                LastPayoutRequestedAtUtc = table.Column<DateTime>(type: "datetime2", nullable: true),
                CreatedByUserId = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: true),
                CreatedDateTime = table.Column<DateTime>(type: "datetime2", nullable: false),
                ModifiedByUserId = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: true),
                ModifiedDateTime = table.Column<DateTime>(type: "datetime2", nullable: true),
                IsDelete = table.Column<bool>(type: "bit", nullable: false),
                BusinessId = table.Column<Guid>(type: "uniqueidentifier", nullable: false)
            },
            constraints: table => table.PrimaryKey("PK_TeacherWallets", x => x.Id));

        migrationBuilder.CreateTable(
            name: "TeacherCourseSales",
            schema: "Finance",
            columns: table => new
            {
                Id = table.Column<long>(type: "bigint", nullable: false)
                    .Annotation("SqlServer:Identity", "1, 1"),
                TeacherId = table.Column<long>(type: "bigint", nullable: false),
                CourseId = table.Column<long>(type: "bigint", nullable: false),
                OrderId = table.Column<long>(type: "bigint", nullable: false),
                InvoiceId = table.Column<long>(type: "bigint", nullable: false),
                StudentId = table.Column<long>(type: "bigint", nullable: false),
                CourseTitle = table.Column<string>(type: "nvarchar(300)", maxLength: 300, nullable: false),
                Quantity = table.Column<int>(type: "int", nullable: false),
                GrossAmountToman = table.Column<long>(type: "bigint", nullable: false),
                TaxAmountToman = table.Column<long>(type: "bigint", nullable: false),
                PlatformFeeToman = table.Column<long>(type: "bigint", nullable: false),
                NetAmountToman = table.Column<long>(type: "bigint", nullable: false),
                PaymentReference = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: false),
                SoldAtUtc = table.Column<DateTime>(type: "datetime2", nullable: false),
                CreatedByUserId = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: true),
                CreatedDateTime = table.Column<DateTime>(type: "datetime2", nullable: false),
                ModifiedByUserId = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: true),
                ModifiedDateTime = table.Column<DateTime>(type: "datetime2", nullable: true),
                IsDelete = table.Column<bool>(type: "bit", nullable: false),
                BusinessId = table.Column<Guid>(type: "uniqueidentifier", nullable: false)
            },
            constraints: table => table.PrimaryKey("PK_TeacherCourseSales", x => x.Id));

        migrationBuilder.CreateTable(
            name: "TeacherPayoutRequests",
            schema: "Finance",
            columns: table => new
            {
                Id = table.Column<long>(type: "bigint", nullable: false)
                    .Annotation("SqlServer:Identity", "1, 1"),
                TeacherId = table.Column<long>(type: "bigint", nullable: false),
                AmountToman = table.Column<long>(type: "bigint", nullable: false),
                Status = table.Column<int>(type: "int", nullable: false),
                RequestedAtUtc = table.Column<DateTime>(type: "datetime2", nullable: false),
                ProcessedAtUtc = table.Column<DateTime>(type: "datetime2", nullable: true),
                TeacherNote = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: true),
                AdminNote = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: true),
                TransferReference = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: true),
                CreatedByUserId = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: true),
                CreatedDateTime = table.Column<DateTime>(type: "datetime2", nullable: false),
                ModifiedByUserId = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: true),
                ModifiedDateTime = table.Column<DateTime>(type: "datetime2", nullable: true),
                IsDelete = table.Column<bool>(type: "bit", nullable: false),
                BusinessId = table.Column<Guid>(type: "uniqueidentifier", nullable: false)
            },
            constraints: table => table.PrimaryKey("PK_TeacherPayoutRequests", x => x.Id));

        migrationBuilder.CreateIndex(
            name: "IX_TeacherWallets_TeacherId",
            schema: "Finance",
            table: "TeacherWallets",
            column: "TeacherId",
            unique: true);

        migrationBuilder.CreateIndex(
            name: "IX_TeacherCourseSales_PaymentReference",
            schema: "Finance",
            table: "TeacherCourseSales",
            column: "PaymentReference",
            unique: true);

        migrationBuilder.CreateIndex(
            name: "IX_TeacherCourseSales_TeacherId_SoldAtUtc",
            schema: "Finance",
            table: "TeacherCourseSales",
            columns: new[] { "TeacherId", "SoldAtUtc" });

        migrationBuilder.CreateIndex(
            name: "IX_TeacherPayoutRequests_TeacherId_RequestedAtUtc",
            schema: "Finance",
            table: "TeacherPayoutRequests",
            columns: new[] { "TeacherId", "RequestedAtUtc" });

        migrationBuilder.Sql("""
            INSERT INTO [Finance].[PlatformFinanceSettings]
            ([IncomeTaxPercent],[PayoutCooldownHours],[PlatformFeePercent],[TotalCentralBalanceToman],[CreatedDateTime],[IsDelete],[BusinessId])
            VALUES (5, 24, 0, 0, GETUTCDATE(), 0, NEWID());
            """);
    }

    protected override void Down(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.DropTable(name: "TeacherPayoutRequests", schema: "Finance");
        migrationBuilder.DropTable(name: "TeacherCourseSales", schema: "Finance");
        migrationBuilder.DropTable(name: "TeacherWallets", schema: "Finance");
        migrationBuilder.DropTable(name: "PlatformFinanceSettings", schema: "Finance");
    }
}
