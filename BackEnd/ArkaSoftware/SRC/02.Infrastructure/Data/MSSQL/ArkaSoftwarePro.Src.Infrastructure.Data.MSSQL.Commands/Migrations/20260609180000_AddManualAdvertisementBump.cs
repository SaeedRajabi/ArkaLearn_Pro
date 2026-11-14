using Microsoft.EntityFrameworkCore.Migrations;
using Microsoft.EntityFrameworkCore.Infrastructure;

#nullable disable

using ArkaSoftwarePro.Src.Infrastructure.Data.MSSQL.Commands.Common;

namespace ArkaSoftwarePro.Src.Infrastructure.Data.MSSQL.Commands.Migrations;

[DbContext(typeof(ArkaSoftwareCommandDbContext))]
[Migration("20260609180000_AddManualAdvertisementBump")]
public partial class AddManualAdvertisementBump : Migration
{
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.AddColumn<DateTime>(
            name: "LastManualBumpAtUtc",
            schema: "Teacher",
            table: "Advertisements",
            type: "datetime2",
            nullable: true);

        migrationBuilder.AddColumn<int>(
            name: "ManualBumpCooldownMinutes",
            schema: "Teacher",
            table: "AdvertisementMonetizationSettings",
            type: "int",
            nullable: false,
            defaultValue: 25);
    }

    protected override void Down(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.DropColumn(
            name: "LastManualBumpAtUtc",
            schema: "Teacher",
            table: "Advertisements");

        migrationBuilder.DropColumn(
            name: "ManualBumpCooldownMinutes",
            schema: "Teacher",
            table: "AdvertisementMonetizationSettings");
    }
}
