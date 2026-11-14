using Microsoft.EntityFrameworkCore.Migrations;
using Microsoft.EntityFrameworkCore.Infrastructure;

#nullable disable

using ArkaSoftwarePro.Src.Infrastructure.Data.MSSQL.Commands.Common;

namespace ArkaSoftwarePro.Src.Infrastructure.Data.MSSQL.Commands.Migrations;

[DbContext(typeof(ArkaSoftwareCommandDbContext))]
[Migration("20260609210000_AddTeacherFollow")]
public partial class AddTeacherFollow : Migration
{
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.CreateTable(
            name: "TeacherFollows",
            schema: "Teacher",
            columns: table => new
            {
                Id = table.Column<long>(type: "bigint", nullable: false)
                    .Annotation("SqlServer:Identity", "1, 1"),
                FollowerUserId = table.Column<long>(type: "bigint", nullable: false),
                TeacherId = table.Column<long>(type: "bigint", nullable: false),
                CreatedDateTime = table.Column<DateTime>(type: "datetime2", nullable: true),
                ModifiedDateTime = table.Column<DateTime>(type: "datetime2", nullable: true),
                IsDelete = table.Column<bool>(type: "bit", nullable: false, defaultValue: false),
            },
            constraints: table =>
            {
                table.PrimaryKey("PK_TeacherFollows", x => x.Id);
            });

        migrationBuilder.CreateIndex(
            name: "IX_TeacherFollows_FollowerUserId_TeacherId",
            schema: "Teacher",
            table: "TeacherFollows",
            columns: new[] { "FollowerUserId", "TeacherId" },
            unique: true);

        migrationBuilder.CreateIndex(
            name: "IX_TeacherFollows_TeacherId",
            schema: "Teacher",
            table: "TeacherFollows",
            column: "TeacherId");
    }

    protected override void Down(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.DropTable(
            name: "TeacherFollows",
            schema: "Teacher");
    }
}
