using Microsoft.EntityFrameworkCore.Migrations;
using Microsoft.EntityFrameworkCore.Infrastructure;

#nullable disable

using ArkaSoftwarePro.Src.Infrastructure.Data.MSSQL.Commands.Common;

namespace ArkaSoftwarePro.Src.Infrastructure.Data.MSSQL.Commands.Migrations;

[DbContext(typeof(ArkaSoftwareCommandDbContext))]
[Migration("20260623140000_AddAdvertisementMonetizationPhase2")]
public partial class AddAdvertisementMonetizationPhase2 : Migration
{
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.AddColumn<int>(
            name: "AutoBumpIntervalMinutes",
            schema: "Teacher",
            table: "AdvertisementMonetizationSettings",
            type: "int",
            nullable: false,
            defaultValue: 60);

        migrationBuilder.AddColumn<long>(
            name: "OneTimeBumpPriceToman",
            schema: "Teacher",
            table: "AdvertisementMonetizationSettings",
            type: "bigint",
            nullable: false,
            defaultValue: 50000L);

        migrationBuilder.AddColumn<bool>(
            name: "SubscriptionIncludesAutoBump",
            schema: "Teacher",
            table: "AdvertisementMonetizationSettings",
            type: "bit",
            nullable: false,
            defaultValue: true);

        migrationBuilder.AddColumn<int>(
            name: "XpRewardPublishCourse",
            schema: "Teacher",
            table: "AdvertisementMonetizationSettings",
            type: "int",
            nullable: false,
            defaultValue: 15);

        migrationBuilder.AddColumn<int>(
            name: "XpRewardPublishArticle",
            schema: "Teacher",
            table: "AdvertisementMonetizationSettings",
            type: "int",
            nullable: false,
            defaultValue: 10);

        migrationBuilder.AddColumn<int>(
            name: "XpRewardPortfolioArticle",
            schema: "Teacher",
            table: "AdvertisementMonetizationSettings",
            type: "int",
            nullable: false,
            defaultValue: 10);

        migrationBuilder.CreateTable(
            name: "AdvertisementAutoBumpPackages",
            schema: "Teacher",
            columns: table => new
            {
                Id = table.Column<long>(type: "bigint", nullable: false)
                    .Annotation("SqlServer:Identity", "1, 1"),
                Name = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: false),
                DurationDays = table.Column<int>(type: "int", nullable: false),
                PriceToman = table.Column<long>(type: "bigint", nullable: false),
                IsActive = table.Column<bool>(type: "bit", nullable: false),
                CreatedByUserId = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: true),
                CreatedDateTime = table.Column<DateTime>(type: "datetime2", nullable: false),
                ModifiedByUserId = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: true),
                ModifiedDateTime = table.Column<DateTime>(type: "datetime2", nullable: true),
                IsDelete = table.Column<bool>(type: "bit", nullable: false),
                BusinessId = table.Column<Guid>(type: "uniqueidentifier", nullable: false)
            },
            constraints: table => table.PrimaryKey("PK_AdvertisementAutoBumpPackages", x => x.Id));

        migrationBuilder.CreateTable(
            name: "AdvertisementAutoBumpPurchases",
            schema: "Teacher",
            columns: table => new
            {
                Id = table.Column<long>(type: "bigint", nullable: false)
                    .Annotation("SqlServer:Identity", "1, 1"),
                TeacherId = table.Column<long>(type: "bigint", nullable: false),
                PackageId = table.Column<long>(type: "bigint", nullable: false),
                PaidAmountToman = table.Column<long>(type: "bigint", nullable: false),
                StartedAtUtc = table.Column<DateTime>(type: "datetime2", nullable: false),
                ExpiresAtUtc = table.Column<DateTime>(type: "datetime2", nullable: false),
                LastAutoBumpAtUtc = table.Column<DateTime>(type: "datetime2", nullable: true),
                PaymentReference = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: true),
                PurchaseType = table.Column<int>(type: "int", nullable: false),
                CreatedByUserId = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: true),
                CreatedDateTime = table.Column<DateTime>(type: "datetime2", nullable: false),
                ModifiedByUserId = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: true),
                ModifiedDateTime = table.Column<DateTime>(type: "datetime2", nullable: true),
                IsDelete = table.Column<bool>(type: "bit", nullable: false),
                BusinessId = table.Column<Guid>(type: "uniqueidentifier", nullable: false)
            },
            constraints: table => table.PrimaryKey("PK_AdvertisementAutoBumpPurchases", x => x.Id));

        migrationBuilder.CreateTable(
            name: "AdvertisementMonetizationRevenues",
            schema: "Teacher",
            columns: table => new
            {
                Id = table.Column<long>(type: "bigint", nullable: false)
                    .Annotation("SqlServer:Identity", "1, 1"),
                RevenueType = table.Column<int>(type: "int", nullable: false),
                TeacherId = table.Column<long>(type: "bigint", nullable: false),
                PayerUserId = table.Column<long>(type: "bigint", nullable: false),
                AmountToman = table.Column<long>(type: "bigint", nullable: false),
                PaymentReference = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: true),
                Description = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: true),
                OccurredAtUtc = table.Column<DateTime>(type: "datetime2", nullable: false),
                CreatedByUserId = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: true),
                CreatedDateTime = table.Column<DateTime>(type: "datetime2", nullable: false),
                ModifiedByUserId = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: true),
                ModifiedDateTime = table.Column<DateTime>(type: "datetime2", nullable: true),
                IsDelete = table.Column<bool>(type: "bit", nullable: false),
                BusinessId = table.Column<Guid>(type: "uniqueidentifier", nullable: false)
            },
            constraints: table => table.PrimaryKey("PK_AdvertisementMonetizationRevenues", x => x.Id));

        migrationBuilder.CreateIndex(
            name: "IX_AdvertisementAutoBumpPurchases_TeacherId_ExpiresAtUtc",
            schema: "Teacher",
            table: "AdvertisementAutoBumpPurchases",
            columns: new[] { "TeacherId", "ExpiresAtUtc" });

        migrationBuilder.CreateIndex(
            name: "IX_AdvertisementMonetizationRevenues_OccurredAtUtc",
            schema: "Teacher",
            table: "AdvertisementMonetizationRevenues",
            column: "OccurredAtUtc");

        migrationBuilder.Sql(@"
INSERT INTO [Teacher].[AdvertisementAutoBumpPackages]
    ([Name],[DurationDays],[PriceToman],[IsActive],[CreatedDateTime],[ModifiedDateTime],[IsDelete],[BusinessId])
VALUES
    (N'بسته bump خودکار ۷ روزه', 7, 150000, 1, SYSUTCDATETIME(), SYSUTCDATETIME(), 0, NEWID()),
    (N'بسته bump خودکار ۳۰ روزه', 30, 450000, 1, SYSUTCDATETIME(), SYSUTCDATETIME(), 0, NEWID());
");
    }

    protected override void Down(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.DropTable(name: "AdvertisementMonetizationRevenues", schema: "Teacher");
        migrationBuilder.DropTable(name: "AdvertisementAutoBumpPurchases", schema: "Teacher");
        migrationBuilder.DropTable(name: "AdvertisementAutoBumpPackages", schema: "Teacher");

        migrationBuilder.DropColumn(name: "AutoBumpIntervalMinutes", schema: "Teacher", table: "AdvertisementMonetizationSettings");
        migrationBuilder.DropColumn(name: "OneTimeBumpPriceToman", schema: "Teacher", table: "AdvertisementMonetizationSettings");
        migrationBuilder.DropColumn(name: "SubscriptionIncludesAutoBump", schema: "Teacher", table: "AdvertisementMonetizationSettings");
        migrationBuilder.DropColumn(name: "XpRewardPublishCourse", schema: "Teacher", table: "AdvertisementMonetizationSettings");
        migrationBuilder.DropColumn(name: "XpRewardPublishArticle", schema: "Teacher", table: "AdvertisementMonetizationSettings");
        migrationBuilder.DropColumn(name: "XpRewardPortfolioArticle", schema: "Teacher", table: "AdvertisementMonetizationSettings");
    }
}
