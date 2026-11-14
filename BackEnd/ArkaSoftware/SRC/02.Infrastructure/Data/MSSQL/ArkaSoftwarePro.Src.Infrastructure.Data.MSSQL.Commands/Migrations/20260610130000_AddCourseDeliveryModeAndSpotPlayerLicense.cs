using System;
using Microsoft.EntityFrameworkCore.Migrations;
using Microsoft.EntityFrameworkCore.Infrastructure;

#nullable disable

using ArkaSoftwarePro.Src.Infrastructure.Data.MSSQL.Commands.Common;

namespace ArkaSoftwarePro.Src.Infrastructure.Data.MSSQL.Commands.Migrations
{
    [DbContext(typeof(ArkaSoftwareCommandDbContext))]
[Migration("20260610130000_AddCourseDeliveryModeAndSpotPlayerLicense")]
public partial class AddCourseDeliveryModeAndSpotPlayerLicense : Migration
    {
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "DeliveryMode",
                schema: "Course",
                table: "Courses",
                type: "int",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<string>(
                name: "SpotPlayerCourseKey",
                schema: "Course",
                table: "Courses",
                type: "nvarchar(100)",
                maxLength: 100,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "SpotPlayerLicense",
                schema: "Enrollment",
                table: "Enrollments",
                type: "nvarchar(200)",
                maxLength: 200,
                nullable: true);
        }

        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "DeliveryMode",
                schema: "Course",
                table: "Courses");

            migrationBuilder.DropColumn(
                name: "SpotPlayerCourseKey",
                schema: "Course",
                table: "Courses");

            migrationBuilder.DropColumn(
                name: "SpotPlayerLicense",
                schema: "Enrollment",
                table: "Enrollments");
        }
    }
}
