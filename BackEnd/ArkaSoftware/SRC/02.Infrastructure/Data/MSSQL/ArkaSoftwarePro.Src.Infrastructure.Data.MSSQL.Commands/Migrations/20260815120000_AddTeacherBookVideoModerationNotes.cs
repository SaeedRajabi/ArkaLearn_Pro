using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

using ArkaSoftwarePro.Src.Infrastructure.Data.MSSQL.Commands.Common;

namespace ArkaSoftwarePro.Src.Infrastructure.Data.MSSQL.Commands.Migrations;

[DbContext(typeof(ArkaSoftwareCommandDbContext))]
[Migration("20260815120000_AddTeacherBookVideoModerationNotes")]
public partial class AddTeacherBookVideoModerationNotes : Migration
{
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.AddColumn<string>(
            name: "RejectionNote",
            schema: "Teacher",
            table: "Books",
            type: "nvarchar(2000)",
            maxLength: 2000,
            nullable: true);

        migrationBuilder.AddColumn<DateTime>(
            name: "SubmittedAtUtc",
            schema: "Teacher",
            table: "Books",
            type: "datetime2",
            nullable: true);

        migrationBuilder.AddColumn<string>(
            name: "RejectionNote",
            schema: "Teacher",
            table: "PromotionalVideos",
            type: "nvarchar(2000)",
            maxLength: 2000,
            nullable: true);

        migrationBuilder.AddColumn<DateTime>(
            name: "SubmittedAtUtc",
            schema: "Teacher",
            table: "PromotionalVideos",
            type: "datetime2",
            nullable: true);
    }

    protected override void Down(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.DropColumn(name: "SubmittedAtUtc", schema: "Teacher", table: "PromotionalVideos");
        migrationBuilder.DropColumn(name: "RejectionNote", schema: "Teacher", table: "PromotionalVideos");
        migrationBuilder.DropColumn(name: "SubmittedAtUtc", schema: "Teacher", table: "Books");
        migrationBuilder.DropColumn(name: "RejectionNote", schema: "Teacher", table: "Books");
    }
}
