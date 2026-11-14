using Microsoft.EntityFrameworkCore.Migrations;
using Microsoft.EntityFrameworkCore.Infrastructure;

#nullable disable

using ArkaSoftwarePro.Src.Infrastructure.Data.MSSQL.Commands.Common;

namespace ArkaSoftwarePro.Src.Infrastructure.Data.MSSQL.Commands.Migrations;

[DbContext(typeof(ArkaSoftwareCommandDbContext))]
[Migration("20260724140000_AddProjectOrderProjectType")]
public partial class AddProjectOrderProjectType : Migration
{
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.AddColumn<string>(
            name: "ProjectType",
            schema: "ProjectOrder",
            table: "ProjectOrders",
            type: "nvarchar(50)",
            maxLength: 50,
            nullable: false,
            defaultValue: "other");
    }

    protected override void Down(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.DropColumn(
            name: "ProjectType",
            schema: "ProjectOrder",
            table: "ProjectOrders");
    }
}
