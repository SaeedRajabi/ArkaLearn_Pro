using Microsoft.EntityFrameworkCore.Migrations;
using Microsoft.EntityFrameworkCore.Infrastructure;

#nullable disable

using ArkaSoftwarePro.Src.Infrastructure.Data.MSSQL.Commands.Common;

namespace ArkaSoftwarePro.Src.Infrastructure.Data.MSSQL.Commands.Migrations;

[DbContext(typeof(ArkaSoftwareCommandDbContext))]
[Migration("20260729140000_FixTeacherExpertiseAreaUniqueIndex")]
public partial class FixTeacherExpertiseAreaUniqueIndex : Migration
{
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.DropIndex(
            name: "IX_ExpertiseAreas_Name",
            schema: "Teacher",
            table: "ExpertiseAreas");

        migrationBuilder.CreateIndex(
            name: "IX_ExpertiseAreas_Name",
            schema: "Teacher",
            table: "ExpertiseAreas",
            column: "Name");

        migrationBuilder.CreateIndex(
            name: "IX_ExpertiseAreas_TeacherId_Name",
            schema: "Teacher",
            table: "ExpertiseAreas",
            columns: new[] { "TeacherId", "Name" },
            unique: true,
            filter: "[Name] IS NOT NULL");
    }

    protected override void Down(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.DropIndex(
            name: "IX_ExpertiseAreas_TeacherId_Name",
            schema: "Teacher",
            table: "ExpertiseAreas");

        migrationBuilder.DropIndex(
            name: "IX_ExpertiseAreas_Name",
            schema: "Teacher",
            table: "ExpertiseAreas");

        migrationBuilder.CreateIndex(
            name: "IX_ExpertiseAreas_Name",
            schema: "Teacher",
            table: "ExpertiseAreas",
            column: "Name",
            unique: true,
            filter: "[Name] IS NOT NULL");
    }
}
