using Microsoft.EntityFrameworkCore.Migrations;
using Microsoft.EntityFrameworkCore.Infrastructure;

#nullable disable

using ArkaSoftwarePro.Src.Infrastructure.Data.MSSQL.Commands.Common;

namespace ArkaSoftwarePro.Src.Infrastructure.Data.MSSQL.Commands.Migrations;

[DbContext(typeof(ArkaSoftwareCommandDbContext))]
[Migration("20260730140000_AddTeacherReviewApprovedSnapshots")]
public partial class AddTeacherReviewApprovedSnapshots : Migration
{
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.AddColumn<string>(
            name: "ProfileApprovedSnapshotJson",
            schema: "Teacher",
            table: "Teachers",
            type: "nvarchar(max)",
            nullable: true);

        migrationBuilder.AddColumn<string>(
            name: "ApprovedSnapshotJson",
            schema: "Teacher",
            table: "Advertisements",
            type: "nvarchar(max)",
            nullable: true);

        migrationBuilder.AddColumn<string>(
            name: "ApprovedSnapshotJson",
            schema: "Teacher",
            table: "PromotionalVideos",
            type: "nvarchar(max)",
            nullable: true);

        migrationBuilder.AddColumn<string>(
            name: "ApprovedSnapshotJson",
            schema: "Teacher",
            table: "Books",
            type: "nvarchar(max)",
            nullable: true);

        migrationBuilder.AddColumn<string>(
            name: "ApprovedSnapshotJson",
            schema: "Teacher",
            table: "PortfolioArticles",
            type: "nvarchar(max)",
            nullable: true);
    }

    protected override void Down(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.DropColumn(name: "ProfileApprovedSnapshotJson", schema: "Teacher", table: "Teachers");
        migrationBuilder.DropColumn(name: "ApprovedSnapshotJson", schema: "Teacher", table: "Advertisements");
        migrationBuilder.DropColumn(name: "ApprovedSnapshotJson", schema: "Teacher", table: "PromotionalVideos");
        migrationBuilder.DropColumn(name: "ApprovedSnapshotJson", schema: "Teacher", table: "Books");
        migrationBuilder.DropColumn(name: "ApprovedSnapshotJson", schema: "Teacher", table: "PortfolioArticles");
    }
}
