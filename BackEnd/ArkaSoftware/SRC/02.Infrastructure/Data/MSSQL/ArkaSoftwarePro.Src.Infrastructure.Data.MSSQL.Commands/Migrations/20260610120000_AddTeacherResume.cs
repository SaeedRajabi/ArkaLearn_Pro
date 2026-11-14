using Microsoft.EntityFrameworkCore.Migrations;
using Microsoft.EntityFrameworkCore.Infrastructure;

#nullable disable

using ArkaSoftwarePro.Src.Infrastructure.Data.MSSQL.Commands.Common;

namespace ArkaSoftwarePro.Src.Infrastructure.Data.MSSQL.Commands.Migrations;

[DbContext(typeof(ArkaSoftwareCommandDbContext))]
[Migration("20260610120000_AddTeacherResume")]
public partial class AddTeacherResume : Migration
{
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.CreateTable(
            name: "Resumes",
            schema: "Teacher",
            columns: table => new
            {
                Id = table.Column<long>(type: "bigint", nullable: false)
                    .Annotation("SqlServer:Identity", "1, 1"),
                TeacherId = table.Column<long>(type: "bigint", nullable: false),
                Title = table.Column<string>(type: "nvarchar(300)", maxLength: 300, nullable: false),
                Description = table.Column<string>(type: "nvarchar(2000)", maxLength: 2000, nullable: false),
                PdfFileUrl = table.Column<string>(type: "nvarchar(2000)", maxLength: 2000, nullable: false),
                PdfFileName = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: true),
                ApprovalStatus = table.Column<byte>(type: "tinyint", nullable: false),
                SubmittedAtUtc = table.Column<DateTime>(type: "datetime2", nullable: true),
                ApprovedSnapshotJson = table.Column<string>(type: "nvarchar(max)", nullable: true),
                CreatedDateTime = table.Column<DateTime>(type: "datetime2", nullable: true),
                ModifiedDateTime = table.Column<DateTime>(type: "datetime2", nullable: true),
                IsDelete = table.Column<bool>(type: "bit", nullable: false, defaultValue: false),
            },
            constraints: table =>
            {
                table.PrimaryKey("PK_Resumes", x => x.Id);
                table.ForeignKey(
                    name: "FK_Resumes_Teachers_TeacherId",
                    column: x => x.TeacherId,
                    principalSchema: "Teacher",
                    principalTable: "Teachers",
                    principalColumn: "Id",
                    onDelete: ReferentialAction.Cascade);
            });

        migrationBuilder.CreateIndex(
            name: "IX_Resumes_TeacherId",
            schema: "Teacher",
            table: "Resumes",
            column: "TeacherId",
            unique: true);
    }

    protected override void Down(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.DropTable(
            name: "Resumes",
            schema: "Teacher");
    }
}
