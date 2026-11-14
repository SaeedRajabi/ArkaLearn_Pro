using Microsoft.EntityFrameworkCore.Migrations;
using Microsoft.EntityFrameworkCore.Infrastructure;

#nullable disable

using ArkaSoftwarePro.Src.Infrastructure.Data.MSSQL.Commands.Common;

namespace ArkaSoftwarePro.Src.Infrastructure.Data.MSSQL.Commands.Migrations;

[DbContext(typeof(ArkaSoftwareCommandDbContext))]
[Migration("20260626140000_AddAdvertisementMonetizationPhase3")]
public partial class AddAdvertisementMonetizationPhase3 : Migration
{
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.CreateTable(
            name: "TeacherExperiencePointEvents",
            schema: "Teacher",
            columns: table => new
            {
                Id = table.Column<long>(type: "bigint", nullable: false)
                    .Annotation("SqlServer:Identity", "1, 1"),
                TeacherId = table.Column<long>(type: "bigint", nullable: false),
                Amount = table.Column<int>(type: "int", nullable: false),
                Reason = table.Column<int>(type: "int", nullable: false),
                Description = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: true),
                BalanceAfter = table.Column<int>(type: "int", nullable: false),
                OccurredAtUtc = table.Column<DateTime>(type: "datetime2", nullable: false),
                CreatedByUserId = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: true),
                CreatedDateTime = table.Column<DateTime>(type: "datetime2", nullable: false),
                ModifiedByUserId = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: true),
                ModifiedDateTime = table.Column<DateTime>(type: "datetime2", nullable: true),
                IsDelete = table.Column<bool>(type: "bit", nullable: false),
                BusinessId = table.Column<Guid>(type: "uniqueidentifier", nullable: false)
            },
            constraints: table => table.PrimaryKey("PK_TeacherExperiencePointEvents", x => x.Id));

        migrationBuilder.CreateIndex(
            name: "IX_TeacherExperiencePointEvents_TeacherId_OccurredAtUtc",
            schema: "Teacher",
            table: "TeacherExperiencePointEvents",
            columns: new[] { "TeacherId", "OccurredAtUtc" });
    }

    protected override void Down(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.DropTable(name: "TeacherExperiencePointEvents", schema: "Teacher");
    }
}
