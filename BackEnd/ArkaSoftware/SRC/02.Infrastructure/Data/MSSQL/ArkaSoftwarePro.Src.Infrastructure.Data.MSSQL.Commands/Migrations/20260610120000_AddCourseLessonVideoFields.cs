using System;
using Microsoft.EntityFrameworkCore.Migrations;
using Microsoft.EntityFrameworkCore.Infrastructure;

#nullable disable

using ArkaSoftwarePro.Src.Infrastructure.Data.MSSQL.Commands.Common;

namespace ArkaSoftwarePro.Src.Infrastructure.Data.MSSQL.Commands.Migrations
{
    /// <inheritdoc />
    [DbContext(typeof(ArkaSoftwareCommandDbContext))]
[Migration("20260610120000_AddCourseLessonVideoFields")]
public partial class AddCourseLessonVideoFields : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "DurationSeconds",
                schema: "Course",
                table: "CourseLesson",
                type: "int",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<int>(
                name: "SortOrder",
                schema: "Course",
                table: "CourseLesson",
                type: "int",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<string>(
                name: "VideoPath",
                schema: "Course",
                table: "CourseLesson",
                type: "nvarchar(500)",
                maxLength: 500,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "VideoTitle",
                schema: "Course",
                table: "CourseLesson",
                type: "nvarchar(500)",
                maxLength: 500,
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "DurationSeconds",
                schema: "Course",
                table: "CourseLesson");

            migrationBuilder.DropColumn(
                name: "SortOrder",
                schema: "Course",
                table: "CourseLesson");

            migrationBuilder.DropColumn(
                name: "VideoPath",
                schema: "Course",
                table: "CourseLesson");

            migrationBuilder.DropColumn(
                name: "VideoTitle",
                schema: "Course",
                table: "CourseLesson");
        }
    }
}
