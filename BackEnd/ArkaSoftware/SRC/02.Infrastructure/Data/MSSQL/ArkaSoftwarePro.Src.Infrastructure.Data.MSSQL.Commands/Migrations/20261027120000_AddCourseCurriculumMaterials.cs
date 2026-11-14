using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ArkaSoftwarePro.Src.Infrastructure.Data.MSSQL.Commands.Migrations;

[Migration("20261027120000_AddCourseCurriculumMaterials")]
public partial class AddCourseCurriculumMaterials : Migration
{
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.CreateTable(
            name: "CurriculumMaterials",
            schema: "Course",
            columns: table => new
            {
                Id = table.Column<long>(type: "bigint", nullable: false)
                    .Annotation("SqlServer:Identity", "1, 1"),
                CourseId = table.Column<long>(type: "bigint", nullable: false),
                CourseSectionId = table.Column<long>(type: "bigint", nullable: false),
                CourseLessonId = table.Column<long>(type: "bigint", nullable: true),
                MediaAssetId = table.Column<long>(type: "bigint", nullable: false),
                DisplayName = table.Column<string>(type: "nvarchar(260)", maxLength: 260, nullable: false),
                SortOrder = table.Column<int>(type: "int", nullable: false),
                CreatedByUserId = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: true),
                CreatedDateTime = table.Column<DateTime>(type: "datetime2", nullable: true),
                ModifiedByUserId = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: true),
                ModifiedDateTime = table.Column<DateTime>(type: "datetime2", nullable: true),
                IsDelete = table.Column<bool>(type: "bit", nullable: false),
                BusinessId = table.Column<Guid>(type: "uniqueidentifier", nullable: false)
            },
            constraints: table =>
            {
                table.PrimaryKey("PK_CurriculumMaterials", x => x.Id);
            });

        migrationBuilder.CreateIndex(
            name: "IX_CurriculumMaterials_Course_Section_Lesson",
            schema: "Course",
            table: "CurriculumMaterials",
            columns: new[] { "CourseId", "CourseSectionId", "CourseLessonId" });

        migrationBuilder.CreateIndex(
            name: "IX_CurriculumMaterials_MediaAssetId",
            schema: "Course",
            table: "CurriculumMaterials",
            column: "MediaAssetId");
    }

    protected override void Down(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.DropTable(name: "CurriculumMaterials", schema: "Course");
    }
}
