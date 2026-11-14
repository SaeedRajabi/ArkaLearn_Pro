using Microsoft.EntityFrameworkCore.Migrations;
using Microsoft.EntityFrameworkCore.Infrastructure;

#nullable disable

using ArkaSoftwarePro.Src.Infrastructure.Data.MSSQL.Commands.Common;

namespace ArkaSoftwarePro.Src.Infrastructure.Data.MSSQL.Commands.Migrations;

[DbContext(typeof(ArkaSoftwareCommandDbContext))]
[Migration("20260710120000_AddProjectOrderGuestContactFields")]
public partial class AddProjectOrderGuestContactFields : Migration
{
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.AddColumn<string>(
            name: "FirstName",
            schema: "ProjectOrder",
            table: "ProjectOrders",
            type: "nvarchar(100)",
            maxLength: 100,
            nullable: false,
            defaultValue: "");

        migrationBuilder.AddColumn<string>(
            name: "LastName",
            schema: "ProjectOrder",
            table: "ProjectOrders",
            type: "nvarchar(100)",
            maxLength: 100,
            nullable: false,
            defaultValue: "");

        migrationBuilder.AddColumn<string>(
            name: "Phone",
            schema: "ProjectOrder",
            table: "ProjectOrders",
            type: "nvarchar(30)",
            maxLength: 30,
            nullable: false,
            defaultValue: "");

        migrationBuilder.AlterColumn<long>(
            name: "UserId",
            schema: "ProjectOrder",
            table: "ProjectOrders",
            type: "bigint",
            nullable: true,
            oldClrType: typeof(long),
            oldType: "bigint");

        migrationBuilder.AlterColumn<string>(
            name: "DescriptionHtml",
            schema: "ProjectOrder",
            table: "ProjectOrders",
            type: "NVARCHAR(MAX)",
            nullable: true,
            oldClrType: typeof(string),
            oldType: "NVARCHAR(MAX)");

        migrationBuilder.CreateIndex(
            name: "IX_ProjectOrders_Phone",
            schema: "ProjectOrder",
            table: "ProjectOrders",
            column: "Phone");
    }

    protected override void Down(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.DropIndex(
            name: "IX_ProjectOrders_Phone",
            schema: "ProjectOrder",
            table: "ProjectOrders");

        migrationBuilder.DropColumn(
            name: "FirstName",
            schema: "ProjectOrder",
            table: "ProjectOrders");

        migrationBuilder.DropColumn(
            name: "LastName",
            schema: "ProjectOrder",
            table: "ProjectOrders");

        migrationBuilder.DropColumn(
            name: "Phone",
            schema: "ProjectOrder",
            table: "ProjectOrders");

        migrationBuilder.AlterColumn<long>(
            name: "UserId",
            schema: "ProjectOrder",
            table: "ProjectOrders",
            type: "bigint",
            nullable: false,
            defaultValue: 0L,
            oldClrType: typeof(long),
            oldType: "bigint",
            oldNullable: true);

        migrationBuilder.AlterColumn<string>(
            name: "DescriptionHtml",
            schema: "ProjectOrder",
            table: "ProjectOrders",
            type: "NVARCHAR(MAX)",
            nullable: false,
            defaultValue: "",
            oldClrType: typeof(string),
            oldType: "NVARCHAR(MAX)",
            oldNullable: true);
    }
}
