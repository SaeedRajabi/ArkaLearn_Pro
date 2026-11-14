using Microsoft.EntityFrameworkCore.Migrations;
using Microsoft.EntityFrameworkCore.Infrastructure;

#nullable disable

using ArkaSoftwarePro.Src.Infrastructure.Data.MSSQL.Commands.Common;

namespace ArkaSoftwarePro.Src.Infrastructure.Data.MSSQL.Commands.Migrations;

[DbContext(typeof(ArkaSoftwareCommandDbContext))]
[Migration("20260622140000_AddAdvertisementMonetization")]
public partial class AddAdvertisementMonetization : Migration
{
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.AddColumn<int>(
            name: "ExperiencePoints",
            schema: "Teacher",
            table: "Teachers",
            type: "int",
            nullable: false,
            defaultValue: 0);

        migrationBuilder.AddColumn<int>(
            name: "XpFreeMonthsRedeemed",
            schema: "Teacher",
            table: "Teachers",
            type: "int",
            nullable: false,
            defaultValue: 0);

        migrationBuilder.AddColumn<DateTime>(
            name: "XpFreePlanUntilUtc",
            schema: "Teacher",
            table: "Teachers",
            type: "datetime2",
            nullable: true);

        migrationBuilder.AddColumn<string>(
            name: "TagsJson",
            schema: "Teacher",
            table: "Advertisements",
            type: "nvarchar(2000)",
            maxLength: 2000,
            nullable: false,
            defaultValue: "[]");

        migrationBuilder.AddColumn<DateTime>(
            name: "LastBumpedAtUtc",
            schema: "Teacher",
            table: "Advertisements",
            type: "datetime2",
            nullable: true);

        migrationBuilder.AddColumn<int>(
            name: "ListingStarLevel",
            schema: "Teacher",
            table: "Advertisements",
            type: "int",
            nullable: false,
            defaultValue: 0);

        migrationBuilder.CreateTable(
            name: "AdvertisementMonetizationSettings",
            schema: "Teacher",
            columns: table => new
            {
                Id = table.Column<long>(type: "bigint", nullable: false)
                    .Annotation("SqlServer:Identity", "1, 1"),
                ContactUnlockPriceToman = table.Column<long>(type: "bigint", nullable: false),
                ContactUnlockHours = table.Column<int>(type: "int", nullable: false),
                FreeMinTags = table.Column<int>(type: "int", nullable: false),
                FreeMaxVideos = table.Column<int>(type: "int", nullable: false),
                FreeMaxDescriptionChars = table.Column<int>(type: "int", nullable: false),
                XpFirstFreeMonthThreshold = table.Column<int>(type: "int", nullable: false),
                XpThresholdIncrementPerMonth = table.Column<int>(type: "int", nullable: false),
                XpRewardSaveAdvertisement = table.Column<int>(type: "int", nullable: false),
                XpRewardSaveVideo = table.Column<int>(type: "int", nullable: false),
                XpRewardSaveBook = table.Column<int>(type: "int", nullable: false),
                CreatedByUserId = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: true),
                CreatedDateTime = table.Column<DateTime>(type: "datetime2", nullable: false),
                ModifiedByUserId = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: true),
                ModifiedDateTime = table.Column<DateTime>(type: "datetime2", nullable: true),
                IsDelete = table.Column<bool>(type: "bit", nullable: false),
                BusinessId = table.Column<Guid>(type: "uniqueidentifier", nullable: false)
            },
            constraints: table => table.PrimaryKey("PK_AdvertisementMonetizationSettings", x => x.Id));

        migrationBuilder.CreateTable(
            name: "AdvertisementTariffs",
            schema: "Teacher",
            columns: table => new
            {
                Id = table.Column<long>(type: "bigint", nullable: false)
                    .Annotation("SqlServer:Identity", "1, 1"),
                DurationMonths = table.Column<int>(type: "int", nullable: false),
                StarLevel = table.Column<int>(type: "int", nullable: false),
                PriceToman = table.Column<long>(type: "bigint", nullable: false),
                DiscountPercent = table.Column<int>(type: "int", nullable: false),
                IsActive = table.Column<bool>(type: "bit", nullable: false),
                CreatedByUserId = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: true),
                CreatedDateTime = table.Column<DateTime>(type: "datetime2", nullable: false),
                ModifiedByUserId = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: true),
                ModifiedDateTime = table.Column<DateTime>(type: "datetime2", nullable: true),
                IsDelete = table.Column<bool>(type: "bit", nullable: false),
                BusinessId = table.Column<Guid>(type: "uniqueidentifier", nullable: false)
            },
            constraints: table => table.PrimaryKey("PK_AdvertisementTariffs", x => x.Id));

        migrationBuilder.CreateTable(
            name: "AdvertisementSubscriptions",
            schema: "Teacher",
            columns: table => new
            {
                Id = table.Column<long>(type: "bigint", nullable: false)
                    .Annotation("SqlServer:Identity", "1, 1"),
                TeacherId = table.Column<long>(type: "bigint", nullable: false),
                TariffId = table.Column<long>(type: "bigint", nullable: false),
                StarLevel = table.Column<int>(type: "int", nullable: false),
                DurationMonths = table.Column<int>(type: "int", nullable: false),
                StartedAtUtc = table.Column<DateTime>(type: "datetime2", nullable: false),
                ExpiresAtUtc = table.Column<DateTime>(type: "datetime2", nullable: false),
                PaymentReference = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: true),
                Status = table.Column<byte>(type: "tinyint", nullable: false),
                CreatedByUserId = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: true),
                CreatedDateTime = table.Column<DateTime>(type: "datetime2", nullable: false),
                ModifiedByUserId = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: true),
                ModifiedDateTime = table.Column<DateTime>(type: "datetime2", nullable: true),
                IsDelete = table.Column<bool>(type: "bit", nullable: false),
                BusinessId = table.Column<Guid>(type: "uniqueidentifier", nullable: false)
            },
            constraints: table => table.PrimaryKey("PK_AdvertisementSubscriptions", x => x.Id));

        migrationBuilder.CreateTable(
            name: "AdvertisementContactUnlocks",
            schema: "Teacher",
            columns: table => new
            {
                Id = table.Column<long>(type: "bigint", nullable: false)
                    .Annotation("SqlServer:Identity", "1, 1"),
                ViewerUserId = table.Column<long>(type: "bigint", nullable: false),
                TeacherId = table.Column<long>(type: "bigint", nullable: false),
                UnlockedAtUtc = table.Column<DateTime>(type: "datetime2", nullable: false),
                ExpiresAtUtc = table.Column<DateTime>(type: "datetime2", nullable: false),
                PaymentReference = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: true),
                CreatedByUserId = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: true),
                CreatedDateTime = table.Column<DateTime>(type: "datetime2", nullable: false),
                ModifiedByUserId = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: true),
                ModifiedDateTime = table.Column<DateTime>(type: "datetime2", nullable: true),
                IsDelete = table.Column<bool>(type: "bit", nullable: false),
                BusinessId = table.Column<Guid>(type: "uniqueidentifier", nullable: false)
            },
            constraints: table => table.PrimaryKey("PK_AdvertisementContactUnlocks", x => x.Id));

        migrationBuilder.CreateIndex(
            name: "IX_AdvertisementTariffs_DurationMonths_StarLevel",
            schema: "Teacher",
            table: "AdvertisementTariffs",
            columns: new[] { "DurationMonths", "StarLevel" },
            unique: true);

        migrationBuilder.CreateIndex(
            name: "IX_AdvertisementSubscriptions_TeacherId_Status",
            schema: "Teacher",
            table: "AdvertisementSubscriptions",
            columns: new[] { "TeacherId", "Status" });

        migrationBuilder.CreateIndex(
            name: "IX_AdvertisementContactUnlocks_ViewerUserId_TeacherId",
            schema: "Teacher",
            table: "AdvertisementContactUnlocks",
            columns: new[] { "ViewerUserId", "TeacherId" });

        migrationBuilder.Sql("""
            INSERT INTO [Teacher].[AdvertisementMonetizationSettings]
                ([ContactUnlockPriceToman],[ContactUnlockHours],[FreeMinTags],[FreeMaxVideos],[FreeMaxDescriptionChars],
                 [XpFirstFreeMonthThreshold],[XpThresholdIncrementPerMonth],[XpRewardSaveAdvertisement],[XpRewardSaveVideo],[XpRewardSaveBook],
                 [CreatedDateTime],[IsDelete],[BusinessId])
            VALUES (20000, 48, 3, 1, 2000, 200, 100, 5, 5, 10, SYSUTCDATETIME(), 0, NEWID());
            """);

        migrationBuilder.Sql("""
            INSERT INTO [Teacher].[AdvertisementTariffs] ([DurationMonths],[StarLevel],[PriceToman],[DiscountPercent],[IsActive],[CreatedDateTime],[IsDelete],[BusinessId]) VALUES
            (1,1,439000,0,1,SYSUTCDATETIME(),0,NEWID()),(1,2,499000,0,1,SYSUTCDATETIME(),0,NEWID()),(1,3,559000,0,1,SYSUTCDATETIME(),0,NEWID()),(1,4,619000,0,1,SYSUTCDATETIME(),0,NEWID()),(1,5,679000,0,1,SYSUTCDATETIME(),0,NEWID()),(1,6,739000,0,1,SYSUTCDATETIME(),0,NEWID()),(1,7,799000,0,1,SYSUTCDATETIME(),0,NEWID()),
            (2,1,790200,10,1,SYSUTCDATETIME(),0,NEWID()),(2,2,898200,10,1,SYSUTCDATETIME(),0,NEWID()),(2,3,1006200,10,1,SYSUTCDATETIME(),0,NEWID()),(2,4,1114200,10,1,SYSUTCDATETIME(),0,NEWID()),(2,5,1222200,10,1,SYSUTCDATETIME(),0,NEWID()),(2,6,1330200,10,1,SYSUTCDATETIME(),0,NEWID()),(2,7,1438200,10,1,SYSUTCDATETIME(),0,NEWID()),
            (3,1,1119450,15,1,SYSUTCDATETIME(),0,NEWID()),(3,2,1272450,15,1,SYSUTCDATETIME(),0,NEWID()),(3,3,1425450,15,1,SYSUTCDATETIME(),0,NEWID()),(3,4,1578450,15,1,SYSUTCDATETIME(),0,NEWID()),(3,5,1731450,15,1,SYSUTCDATETIME(),0,NEWID()),(3,6,1884450,15,1,SYSUTCDATETIME(),0,NEWID()),(3,7,2037450,15,1,SYSUTCDATETIME(),0,NEWID()),
            (6,1,2107200,20,1,SYSUTCDATETIME(),0,NEWID()),(6,2,2395200,20,1,SYSUTCDATETIME(),0,NEWID()),(6,3,2683200,20,1,SYSUTCDATETIME(),0,NEWID()),(6,4,2971200,20,1,SYSUTCDATETIME(),0,NEWID()),(6,5,3259200,20,1,SYSUTCDATETIME(),0,NEWID()),(6,6,3547200,20,1,SYSUTCDATETIME(),0,NEWID()),(6,7,3835200,20,1,SYSUTCDATETIME(),0,NEWID()),
            (12,1,3951000,25,1,SYSUTCDATETIME(),0,NEWID()),(12,2,4491000,25,1,SYSUTCDATETIME(),0,NEWID()),(12,3,5031000,25,1,SYSUTCDATETIME(),0,NEWID()),(12,4,5571000,25,1,SYSUTCDATETIME(),0,NEWID()),(12,5,6111000,25,1,SYSUTCDATETIME(),0,NEWID()),(12,6,6651000,25,1,SYSUTCDATETIME(),0,NEWID()),(12,7,7191000,25,1,SYSUTCDATETIME(),0,NEWID());
            """);
    }

    protected override void Down(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.DropTable(name: "AdvertisementContactUnlocks", schema: "Teacher");
        migrationBuilder.DropTable(name: "AdvertisementSubscriptions", schema: "Teacher");
        migrationBuilder.DropTable(name: "AdvertisementTariffs", schema: "Teacher");
        migrationBuilder.DropTable(name: "AdvertisementMonetizationSettings", schema: "Teacher");
        migrationBuilder.DropColumn(name: "ListingStarLevel", schema: "Teacher", table: "Advertisements");
        migrationBuilder.DropColumn(name: "LastBumpedAtUtc", schema: "Teacher", table: "Advertisements");
        migrationBuilder.DropColumn(name: "TagsJson", schema: "Teacher", table: "Advertisements");
        migrationBuilder.DropColumn(name: "XpFreePlanUntilUtc", schema: "Teacher", table: "Teachers");
        migrationBuilder.DropColumn(name: "XpFreeMonthsRedeemed", schema: "Teacher", table: "Teachers");
        migrationBuilder.DropColumn(name: "ExperiencePoints", schema: "Teacher", table: "Teachers");
    }
}
