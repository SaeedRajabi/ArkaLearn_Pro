using Microsoft.EntityFrameworkCore.Migrations;
using Microsoft.EntityFrameworkCore.Infrastructure;

#nullable disable

using ArkaSoftwarePro.Src.Infrastructure.Data.MSSQL.Commands.Common;

namespace ArkaSoftwarePro.Src.Infrastructure.Data.MSSQL.Commands.Migrations;

[DbContext(typeof(ArkaSoftwareCommandDbContext))]
[Migration("20260609200000_AddCourseLessonWatchProgress")]
public partial class AddCourseLessonWatchProgress : Migration
{
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.CreateTable(
            name: "CourseLessonWatchProgress",
            schema: "Course",
            columns: table => new
            {
                Id = table.Column<long>(type: "bigint", nullable: false)
                    .Annotation("SqlServer:Identity", "1, 1"),
                UserId = table.Column<long>(type: "bigint", nullable: false),
                CourseId = table.Column<long>(type: "bigint", nullable: false),
                LessonId = table.Column<long>(type: "bigint", nullable: false),
                WatchedSeconds = table.Column<int>(type: "int", nullable: false, defaultValue: 0),
                DurationSeconds = table.Column<int>(type: "int", nullable: false, defaultValue: 0),
                IsCompleted = table.Column<bool>(type: "bit", nullable: false, defaultValue: false),
                CompletedAtUtc = table.Column<DateTime>(type: "datetime2", nullable: true),
                LastUpdatedUtc = table.Column<DateTime>(type: "datetime2", nullable: false),
                CreatedDateTime = table.Column<DateTime>(type: "datetime2", nullable: true),
                ModifiedDateTime = table.Column<DateTime>(type: "datetime2", nullable: true),
                IsDelete = table.Column<bool>(type: "bit", nullable: false, defaultValue: false),
            },
            constraints: table =>
            {
                table.PrimaryKey("PK_CourseLessonWatchProgress", x => x.Id);
            });

        migrationBuilder.CreateIndex(
            name: "IX_CourseLessonWatchProgress_UserId_CourseId",
            schema: "Course",
            table: "CourseLessonWatchProgress",
            columns: new[] { "UserId", "CourseId" });

        migrationBuilder.CreateIndex(
            name: "IX_CourseLessonWatchProgress_UserId_LessonId",
            schema: "Course",
            table: "CourseLessonWatchProgress",
            columns: new[] { "UserId", "LessonId" },
            unique: true);
    }

    protected override void Down(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.DropTable(
            name: "CourseLessonWatchProgress",
            schema: "Course");
    }
}
