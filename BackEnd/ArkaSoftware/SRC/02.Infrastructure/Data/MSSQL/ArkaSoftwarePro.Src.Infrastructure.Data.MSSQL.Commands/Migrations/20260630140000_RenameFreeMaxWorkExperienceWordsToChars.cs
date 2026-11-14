using Microsoft.EntityFrameworkCore.Migrations;
using Microsoft.EntityFrameworkCore.Infrastructure;

#nullable disable

using ArkaSoftwarePro.Src.Infrastructure.Data.MSSQL.Commands.Common;

namespace ArkaSoftwarePro.Src.Infrastructure.Data.MSSQL.Commands.Migrations;

[DbContext(typeof(ArkaSoftwareCommandDbContext))]
[Migration("20260630140000_RenameFreeMaxWorkExperienceWordsToChars")]
public partial class RenameFreeMaxWorkExperienceWordsToChars : Migration
{
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.RenameColumn(
            name: "FreeMaxWorkExperienceWords",
            schema: "Teacher",
            table: "AdvertisementMonetizationSettings",
            newName: "FreeMaxWorkExperienceChars");
    }

    protected override void Down(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.RenameColumn(
            name: "FreeMaxWorkExperienceChars",
            schema: "Teacher",
            table: "AdvertisementMonetizationSettings",
            newName: "FreeMaxWorkExperienceWords");
    }
}
