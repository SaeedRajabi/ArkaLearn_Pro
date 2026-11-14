using Microsoft.EntityFrameworkCore.Migrations;
using Microsoft.EntityFrameworkCore.Infrastructure;

#nullable disable

using ArkaSoftwarePro.Src.Infrastructure.Data.MSSQL.Commands.Common;

namespace ArkaSoftwarePro.Src.Infrastructure.Data.MSSQL.Commands.Migrations;

[DbContext(typeof(ArkaSoftwareCommandDbContext))]
[Migration("20260813140000_AddTeacherBookFormatFiles")]
public partial class AddTeacherBookFormatFiles : Migration
{
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.AddColumn<string>(
            name: "PdfFileUrl",
            schema: "Teacher",
            table: "Books",
            type: "nvarchar(2000)",
            maxLength: 2000,
            nullable: true);

        migrationBuilder.AddColumn<string>(
            name: "PdfFileName",
            schema: "Teacher",
            table: "Books",
            type: "nvarchar(260)",
            maxLength: 260,
            nullable: true);

        migrationBuilder.AddColumn<string>(
            name: "EpubFileUrl",
            schema: "Teacher",
            table: "Books",
            type: "nvarchar(2000)",
            maxLength: 2000,
            nullable: true);

        migrationBuilder.AddColumn<string>(
            name: "EpubFileName",
            schema: "Teacher",
            table: "Books",
            type: "nvarchar(260)",
            maxLength: 260,
            nullable: true);

        migrationBuilder.AddColumn<string>(
            name: "WordFileUrl",
            schema: "Teacher",
            table: "Books",
            type: "nvarchar(2000)",
            maxLength: 2000,
            nullable: true);

        migrationBuilder.AddColumn<string>(
            name: "WordFileName",
            schema: "Teacher",
            table: "Books",
            type: "nvarchar(260)",
            maxLength: 260,
            nullable: true);

        migrationBuilder.Sql(
            """
            UPDATE [Teacher].[Books]
            SET PdfFileUrl = BookFileUrl, PdfFileName = BookFileName
            WHERE BookFileUrl IS NOT NULL
              AND (LOWER(BookFileName) LIKE '%.pdf' OR LOWER(BookFileUrl) LIKE '%.pdf');

            UPDATE [Teacher].[Books]
            SET EpubFileUrl = BookFileUrl, EpubFileName = BookFileName
            WHERE BookFileUrl IS NOT NULL
              AND PdfFileUrl IS NULL
              AND (LOWER(BookFileName) LIKE '%.epub' OR LOWER(BookFileUrl) LIKE '%.epub');

            UPDATE [Teacher].[Books]
            SET WordFileUrl = BookFileUrl, WordFileName = BookFileName
            WHERE BookFileUrl IS NOT NULL
              AND PdfFileUrl IS NULL
              AND EpubFileUrl IS NULL
              AND (
                LOWER(BookFileName) LIKE '%.doc'
                OR LOWER(BookFileName) LIKE '%.docx'
                OR LOWER(BookFileUrl) LIKE '%.doc'
                OR LOWER(BookFileUrl) LIKE '%.docx'
              );
            """);
    }

    protected override void Down(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.DropColumn(name: "PdfFileUrl", schema: "Teacher", table: "Books");
        migrationBuilder.DropColumn(name: "PdfFileName", schema: "Teacher", table: "Books");
        migrationBuilder.DropColumn(name: "EpubFileUrl", schema: "Teacher", table: "Books");
        migrationBuilder.DropColumn(name: "EpubFileName", schema: "Teacher", table: "Books");
        migrationBuilder.DropColumn(name: "WordFileUrl", schema: "Teacher", table: "Books");
        migrationBuilder.DropColumn(name: "WordFileName", schema: "Teacher", table: "Books");
    }
}
