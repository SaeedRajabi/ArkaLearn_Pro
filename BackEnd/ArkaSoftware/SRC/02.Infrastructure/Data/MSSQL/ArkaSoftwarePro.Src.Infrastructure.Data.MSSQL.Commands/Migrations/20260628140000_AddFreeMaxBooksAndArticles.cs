using Microsoft.EntityFrameworkCore.Migrations;
using Microsoft.EntityFrameworkCore.Infrastructure;

#nullable disable

using ArkaSoftwarePro.Src.Infrastructure.Data.MSSQL.Commands.Common;

namespace ArkaSoftwarePro.Src.Infrastructure.Data.MSSQL.Commands.Migrations;

[DbContext(typeof(ArkaSoftwareCommandDbContext))]
[Migration("20260628140000_AddFreeMaxBooksAndArticles")]
public partial class AddFreeMaxBooksAndArticles : Migration
{
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.AddColumn<int>(
            name: "FreeMaxBooks",
            schema: "Teacher",
            table: "AdvertisementMonetizationSettings",
            type: "int",
            nullable: false,
            defaultValue: 1);

        migrationBuilder.AddColumn<int>(
            name: "FreeMaxArticles",
            schema: "Teacher",
            table: "AdvertisementMonetizationSettings",
            type: "int",
            nullable: false,
            defaultValue: 1);
    }

    protected override void Down(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.DropColumn(
            name: "FreeMaxBooks",
            schema: "Teacher",
            table: "AdvertisementMonetizationSettings");

        migrationBuilder.DropColumn(
            name: "FreeMaxArticles",
            schema: "Teacher",
            table: "AdvertisementMonetizationSettings");
    }
}
