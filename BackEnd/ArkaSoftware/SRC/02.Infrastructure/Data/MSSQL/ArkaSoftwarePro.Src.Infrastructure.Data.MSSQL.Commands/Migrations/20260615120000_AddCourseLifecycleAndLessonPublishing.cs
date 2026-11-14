using System;
using Microsoft.EntityFrameworkCore.Migrations;
using Microsoft.EntityFrameworkCore.Infrastructure;

#nullable disable

using ArkaSoftwarePro.Src.Infrastructure.Data.MSSQL.Commands.Common;

namespace ArkaSoftwarePro.Src.Infrastructure.Data.MSSQL.Commands.Migrations
{
    [DbContext(typeof(ArkaSoftwareCommandDbContext))]
[Migration("20260615120000_AddCourseLifecycleAndLessonPublishing")]
public partial class AddCourseLifecycleAndLessonPublishing : Migration
    {
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "LifecyclePhase",
                schema: "Course",
                table: "Courses",
                type: "int",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<DateTime>(
                name: "RegistrationDeadlineUtc",
                schema: "Course",
                table: "Courses",
                type: "datetime2",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "CourseStartUtc",
                schema: "Course",
                table: "Courses",
                type: "datetime2",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "CourseEndUtc",
                schema: "Course",
                table: "Courses",
                type: "datetime2",
                nullable: true);

            migrationBuilder.AddColumn<bool>(
                name: "IsPublished",
                schema: "Course",
                table: "CourseLesson",
                type: "bit",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<DateTime>(
                name: "PublishedAtUtc",
                schema: "Course",
                table: "CourseLesson",
                type: "datetime2",
                nullable: true);
        }

        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "LifecyclePhase",
                schema: "Course",
                table: "Courses");

            migrationBuilder.DropColumn(
                name: "RegistrationDeadlineUtc",
                schema: "Course",
                table: "Courses");

            migrationBuilder.DropColumn(
                name: "CourseStartUtc",
                schema: "Course",
                table: "Courses");

            migrationBuilder.DropColumn(
                name: "CourseEndUtc",
                schema: "Course",
                table: "Courses");

            migrationBuilder.DropColumn(
                name: "IsPublished",
                schema: "Course",
                table: "CourseLesson");

            migrationBuilder.DropColumn(
                name: "PublishedAtUtc",
                schema: "Course",
                table: "CourseLesson");
        }
    }
}
