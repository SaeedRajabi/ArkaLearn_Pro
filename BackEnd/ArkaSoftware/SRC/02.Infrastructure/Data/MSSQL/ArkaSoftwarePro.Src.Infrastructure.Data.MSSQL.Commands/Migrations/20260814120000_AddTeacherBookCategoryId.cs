using Microsoft.EntityFrameworkCore.Migrations;
using Microsoft.EntityFrameworkCore.Infrastructure;

#nullable disable

using ArkaSoftwarePro.Src.Infrastructure.Data.MSSQL.Commands.Common;

namespace ArkaSoftwarePro.Src.Infrastructure.Data.MSSQL.Commands.Migrations;

[DbContext(typeof(ArkaSoftwareCommandDbContext))]
[Migration("20260814120000_AddTeacherBookCategoryId")]
public partial class AddTeacherBookCategoryId : Migration
{
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.AddColumn<long>(
            name: "CategoryId",
            schema: "Teacher",
            table: "Books",
            type: "bigint",
            nullable: true);

        migrationBuilder.CreateIndex(
            name: "IX_Books_CategoryId",
            schema: "Teacher",
            table: "Books",
            column: "CategoryId");

        migrationBuilder.AddForeignKey(
            name: "FK_Books_Categories_CategoryId",
            schema: "Teacher",
            table: "Books",
            column: "CategoryId",
            principalSchema: "Category",
            principalTable: "Categories",
            principalColumn: "Id",
            onDelete: ReferentialAction.SetNull);
    }

    protected override void Down(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.DropForeignKey(
            name: "FK_Books_Categories_CategoryId",
            schema: "Teacher",
            table: "Books");

        migrationBuilder.DropIndex(
            name: "IX_Books_CategoryId",
            schema: "Teacher",
            table: "Books");

        migrationBuilder.DropColumn(
            name: "CategoryId",
            schema: "Teacher",
            table: "Books");
    }
}
