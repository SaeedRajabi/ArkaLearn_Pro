using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ArkaSoftwarePro.Src.Infrastructure.Data.MSSQL.Commands.Migrations;

[Migration("20261015120000_AddDesktopLicenseDelivery")]
public partial class AddDesktopLicenseDelivery : Migration
{
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.AddColumn<string>(
            name: "DesktopLicenseKey",
            schema: "Enrollment",
            table: "Enrollments",
            type: "nvarchar(256)",
            maxLength: 256,
            nullable: true);

        migrationBuilder.AddColumn<long>(
            name: "MediaAssetId",
            schema: "Course",
            table: "CourseLesson",
            type: "bigint",
            nullable: true);
    }

    protected override void Down(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.DropColumn(
            name: "DesktopLicenseKey",
            schema: "Enrollment",
            table: "Enrollments");

        migrationBuilder.DropColumn(
            name: "MediaAssetId",
            schema: "Course",
            table: "CourseLesson");
    }
}
