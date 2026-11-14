using Microsoft.EntityFrameworkCore.Migrations;
using Microsoft.EntityFrameworkCore.Infrastructure;

#nullable disable

using ArkaSoftwarePro.Src.Infrastructure.Data.MSSQL.Commands.Common;

namespace ArkaSoftwarePro.Src.Infrastructure.Data.MSSQL.Commands.Migrations;

[DbContext(typeof(ArkaSoftwareCommandDbContext))]
[Migration("20260625120000_AddTeacherBookDetails")]
public partial class AddTeacherBookDetails : Migration
{
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.AddColumn<string>(
            name: "LongDescriptionHtml",
            schema: "Teacher",
            table: "Books",
            type: "NVARCHAR(MAX)",
            nullable: false,
            defaultValue: "");

        migrationBuilder.AddColumn<string>(
            name: "Publisher",
            schema: "Teacher",
            table: "Books",
            type: "nvarchar(200)",
            maxLength: 200,
            nullable: true);

        migrationBuilder.AddColumn<int>(
            name: "PublicationYear",
            schema: "Teacher",
            table: "Books",
            type: "int",
            nullable: true);

        migrationBuilder.AddColumn<string>(
            name: "Isbn",
            schema: "Teacher",
            table: "Books",
            type: "nvarchar(50)",
            maxLength: 50,
            nullable: true);

        migrationBuilder.AddColumn<string>(
            name: "Slug",
            schema: "Teacher",
            table: "Books",
            type: "nvarchar(220)",
            maxLength: 220,
            nullable: false,
            defaultValue: "");

        migrationBuilder.AddColumn<string>(
            name: "TagsJson",
            schema: "Teacher",
            table: "Books",
            type: "nvarchar(2000)",
            maxLength: 2000,
            nullable: false,
            defaultValue: "[]");

        migrationBuilder.Sql("""
            UPDATE [Teacher].[Books]
            SET [Slug] = CONCAT('book-', [Id])
            WHERE [Slug] IS NULL OR [Slug] = '';
            """);

        migrationBuilder.CreateIndex(
            name: "IX_Books_Slug",
            schema: "Teacher",
            table: "Books",
            column: "Slug",
            unique: true);
    }

    protected override void Down(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.DropIndex(name: "IX_Books_Slug", schema: "Teacher", table: "Books");
        migrationBuilder.DropColumn(name: "LongDescriptionHtml", schema: "Teacher", table: "Books");
        migrationBuilder.DropColumn(name: "Publisher", schema: "Teacher", table: "Books");
        migrationBuilder.DropColumn(name: "PublicationYear", schema: "Teacher", table: "Books");
        migrationBuilder.DropColumn(name: "Isbn", schema: "Teacher", table: "Books");
        migrationBuilder.DropColumn(name: "Slug", schema: "Teacher", table: "Books");
        migrationBuilder.DropColumn(name: "TagsJson", schema: "Teacher", table: "Books");
    }
}
