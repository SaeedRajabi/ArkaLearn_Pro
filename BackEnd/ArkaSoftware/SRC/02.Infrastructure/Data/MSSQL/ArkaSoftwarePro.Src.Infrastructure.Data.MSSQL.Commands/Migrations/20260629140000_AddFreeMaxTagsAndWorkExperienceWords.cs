using Microsoft.EntityFrameworkCore.Migrations;
using Microsoft.EntityFrameworkCore.Infrastructure;

#nullable disable

using ArkaSoftwarePro.Src.Infrastructure.Data.MSSQL.Commands.Common;

namespace ArkaSoftwarePro.Src.Infrastructure.Data.MSSQL.Commands.Migrations;

[DbContext(typeof(ArkaSoftwareCommandDbContext))]
[Migration("20260629140000_AddFreeMaxTagsAndWorkExperienceWords")]
public partial class AddFreeMaxTagsAndWorkExperienceWords : Migration
{
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.AddColumn<int>(
            name: "FreeMaxTags",
            schema: "Teacher",
            table: "AdvertisementMonetizationSettings",
            type: "int",
            nullable: false,
            defaultValue: 3);

        migrationBuilder.AddColumn<int>(
            name: "FreeMaxWorkExperienceWords",
            schema: "Teacher",
            table: "AdvertisementMonetizationSettings",
            type: "int",
            nullable: false,
            defaultValue: 1000);
    }

    protected override void Down(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.DropColumn(
            name: "FreeMaxTags",
            schema: "Teacher",
            table: "AdvertisementMonetizationSettings");

        migrationBuilder.DropColumn(
            name: "FreeMaxWorkExperienceWords",
            schema: "Teacher",
            table: "AdvertisementMonetizationSettings");
    }
}
