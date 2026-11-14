using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

using ArkaSoftwarePro.Src.Infrastructure.Data.MSSQL.Commands.Common;

namespace ArkaSoftwarePro.Src.Infrastructure.Data.MSSQL.Commands.Migrations;

[DbContext(typeof(ArkaSoftwareCommandDbContext))]
[Migration("20260815130000_AddCourseModerationStatus")]
public partial class AddCourseModerationStatus : Migration
{
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.AddColumn<byte>(
            name: "ModerationStatus",
            schema: "Course",
            table: "Courses",
            type: "tinyint",
            nullable: false,
            defaultValue: (byte)0);

        migrationBuilder.AddColumn<string>(
            name: "ModerationRejectionNote",
            schema: "Course",
            table: "Courses",
            type: "nvarchar(2000)",
            maxLength: 2000,
            nullable: true);

        migrationBuilder.AddColumn<DateTime>(
            name: "ModerationSubmittedAtUtc",
            schema: "Course",
            table: "Courses",
            type: "datetime2",
            nullable: true);

        migrationBuilder.AddColumn<byte>(
            name: "VideoModerationStatus",
            schema: "Course",
            table: "CourseLesson",
            type: "tinyint",
            nullable: false,
            defaultValue: (byte)0);

        migrationBuilder.AddColumn<string>(
            name: "VideoRejectionNote",
            schema: "Course",
            table: "CourseLesson",
            type: "nvarchar(2000)",
            maxLength: 2000,
            nullable: true);

        migrationBuilder.AddColumn<DateTime>(
            name: "VideoSubmittedAtUtc",
            schema: "Course",
            table: "CourseLesson",
            type: "datetime2",
            nullable: true);

        migrationBuilder.Sql("""
            UPDATE [Course].[Courses]
            SET [ModerationStatus] = 2
            WHERE [IsPublish] = 1;

            UPDATE [Course].[CourseLesson]
            SET [VideoModerationStatus] = 2
            WHERE [IsPublished] = 1
              AND [VideoPath] IS NOT NULL
              AND LEN([VideoPath]) > 0;
            """);
    }

    protected override void Down(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.DropColumn(name: "VideoSubmittedAtUtc", schema: "Course", table: "CourseLesson");
        migrationBuilder.DropColumn(name: "VideoRejectionNote", schema: "Course", table: "CourseLesson");
        migrationBuilder.DropColumn(name: "VideoModerationStatus", schema: "Course", table: "CourseLesson");
        migrationBuilder.DropColumn(name: "ModerationSubmittedAtUtc", schema: "Course", table: "Courses");
        migrationBuilder.DropColumn(name: "ModerationRejectionNote", schema: "Course", table: "Courses");
        migrationBuilder.DropColumn(name: "ModerationStatus", schema: "Course", table: "Courses");
    }
}
