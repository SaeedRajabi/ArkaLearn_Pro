using Microsoft.EntityFrameworkCore.Migrations;
using Microsoft.EntityFrameworkCore.Infrastructure;

#nullable disable

using ArkaSoftwarePro.Src.Infrastructure.Data.MSSQL.Commands.Common;

namespace ArkaSoftwarePro.Src.Infrastructure.Data.MSSQL.Commands.Migrations;

[DbContext(typeof(ArkaSoftwareCommandDbContext))]
[Migration("20260625140000_AddTeacherBookFile")]
public partial class AddTeacherBookFile : Migration
{
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.AddColumn<string>(
            name: "BookFileUrl",
            schema: "Teacher",
            table: "Books",
            type: "nvarchar(2000)",
            maxLength: 2000,
            nullable: true);

        migrationBuilder.AddColumn<string>(
            name: "BookFileName",
            schema: "Teacher",
            table: "Books",
            type: "nvarchar(260)",
            maxLength: 260,
            nullable: true);
    }

    protected override void Down(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.DropColumn(name: "BookFileUrl", schema: "Teacher", table: "Books");
        migrationBuilder.DropColumn(name: "BookFileName", schema: "Teacher", table: "Books");
    }
}
