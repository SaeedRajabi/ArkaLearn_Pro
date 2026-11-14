using Microsoft.EntityFrameworkCore.Migrations;
using Microsoft.EntityFrameworkCore.Infrastructure;

#nullable disable

using ArkaSoftwarePro.Src.Infrastructure.Data.MSSQL.Commands.Common;

namespace ArkaSoftwarePro.Src.Infrastructure.Data.MSSQL.Commands.Migrations;

[DbContext(typeof(ArkaSoftwareCommandDbContext))]
[Migration("20260811160000_AddCourseRegistrationClosed")]
public partial class AddCourseRegistrationClosed : Migration
{
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.AddColumn<bool>(
            name: "IsRegistrationClosed",
            schema: "Course",
            table: "Courses",
            type: "bit",
            nullable: false,
            defaultValue: false);
    }

    protected override void Down(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.DropColumn(
            name: "IsRegistrationClosed",
            schema: "Course",
            table: "Courses");
    }
}
