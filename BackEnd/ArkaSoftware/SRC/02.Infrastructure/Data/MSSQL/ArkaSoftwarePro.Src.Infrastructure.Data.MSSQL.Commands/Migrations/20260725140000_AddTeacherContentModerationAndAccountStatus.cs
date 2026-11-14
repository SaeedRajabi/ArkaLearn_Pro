using Microsoft.EntityFrameworkCore.Migrations;
using Microsoft.EntityFrameworkCore.Infrastructure;

#nullable disable

using ArkaSoftwarePro.Src.Infrastructure.Data.MSSQL.Commands.Common;

namespace ArkaSoftwarePro.Src.Infrastructure.Data.MSSQL.Commands.Migrations;

[DbContext(typeof(ArkaSoftwareCommandDbContext))]
[Migration("20260725140000_AddTeacherContentModerationAndAccountStatus")]
public partial class AddTeacherContentModerationAndAccountStatus : Migration
{
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.AddColumn<byte>(
            name: "AccountStatus",
            schema: "Teacher",
            table: "Teachers",
            type: "tinyint",
            nullable: false,
            defaultValue: (byte)0);

        migrationBuilder.AddColumn<string>(
            name: "AccountStatusNote",
            schema: "Teacher",
            table: "Teachers",
            type: "nvarchar(2000)",
            maxLength: 2000,
            nullable: true);

        migrationBuilder.AddColumn<DateTime>(
            name: "AccountStatusChangedAtUtc",
            schema: "Teacher",
            table: "Teachers",
            type: "datetime2",
            nullable: true);

        migrationBuilder.AddColumn<byte>(
            name: "ApprovalStatus",
            schema: "Teacher",
            table: "Advertisements",
            type: "tinyint",
            nullable: false,
            defaultValue: (byte)0);

        migrationBuilder.AddColumn<string>(
            name: "RejectionNote",
            schema: "Teacher",
            table: "Advertisements",
            type: "nvarchar(2000)",
            maxLength: 2000,
            nullable: true);

        migrationBuilder.AddColumn<DateTime>(
            name: "SubmittedAtUtc",
            schema: "Teacher",
            table: "Advertisements",
            type: "datetime2",
            nullable: true);

        migrationBuilder.Sql("""
            UPDATE [Teacher].[Advertisements]
            SET [ApprovalStatus] = 2
            WHERE [IsPublic] = 1 AND [IsDelete] = 0;
            """);

        migrationBuilder.AddColumn<byte>(
            name: "ModerationStatus",
            schema: "Article",
            table: "Articles",
            type: "tinyint",
            nullable: false,
            defaultValue: (byte)0);

        migrationBuilder.AddColumn<string>(
            name: "ModerationRejectionNote",
            schema: "Article",
            table: "Articles",
            type: "nvarchar(2000)",
            maxLength: 2000,
            nullable: true);

        migrationBuilder.AddColumn<DateTime>(
            name: "ModerationSubmittedAtUtc",
            schema: "Article",
            table: "Articles",
            type: "datetime2",
            nullable: true);

        migrationBuilder.Sql("""
            UPDATE [Article].[Articles]
            SET [ModerationStatus] = 2
            WHERE [IsPublished] = 1;
            """);
    }

    protected override void Down(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.DropColumn(name: "ModerationSubmittedAtUtc", schema: "Article", table: "Articles");
        migrationBuilder.DropColumn(name: "ModerationRejectionNote", schema: "Article", table: "Articles");
        migrationBuilder.DropColumn(name: "ModerationStatus", schema: "Article", table: "Articles");

        migrationBuilder.DropColumn(name: "SubmittedAtUtc", schema: "Teacher", table: "Advertisements");
        migrationBuilder.DropColumn(name: "RejectionNote", schema: "Teacher", table: "Advertisements");
        migrationBuilder.DropColumn(name: "ApprovalStatus", schema: "Teacher", table: "Advertisements");

        migrationBuilder.DropColumn(name: "AccountStatusChangedAtUtc", schema: "Teacher", table: "Teachers");
        migrationBuilder.DropColumn(name: "AccountStatusNote", schema: "Teacher", table: "Teachers");
        migrationBuilder.DropColumn(name: "AccountStatus", schema: "Teacher", table: "Teachers");
    }
}
