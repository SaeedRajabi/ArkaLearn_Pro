using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

using ArkaSoftwarePro.Src.Infrastructure.Data.MSSQL.Commands.Common;

namespace ArkaSoftwarePro.Src.Infrastructure.Data.MSSQL.Commands.Migrations;

[DbContext(typeof(ArkaSoftwareCommandDbContext))]
[Migration("20260815140000_AddVideoWatermarkFields")]
public partial class AddVideoWatermarkFields : Migration
{
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.AddColumn<string>(
            name: "WatermarkedVideoUrl",
            schema: "Teacher",
            table: "PromotionalVideos",
            type: "nvarchar(2000)",
            maxLength: 2000,
            nullable: true);

        migrationBuilder.AddColumn<string>(
            name: "WatermarkedVideoPath",
            schema: "Course",
            table: "CourseLesson",
            type: "nvarchar(500)",
            maxLength: 500,
            nullable: true);
    }

    protected override void Down(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.DropColumn(
            name: "WatermarkedVideoUrl",
            schema: "Teacher",
            table: "PromotionalVideos");

        migrationBuilder.DropColumn(
            name: "WatermarkedVideoPath",
            schema: "Course",
            table: "CourseLesson");
    }
}
