using Microsoft.EntityFrameworkCore.Migrations;
using Microsoft.EntityFrameworkCore.Infrastructure;

#nullable disable

using ArkaSoftwarePro.Src.Infrastructure.Data.MSSQL.Commands.Common;

namespace ArkaSoftwarePro.Src.Infrastructure.Data.MSSQL.Commands.Migrations;

[DbContext(typeof(ArkaSoftwareCommandDbContext))]
[Migration("20260625150000_FixTeacherEducationUniqueIndex")]
public partial class FixTeacherEducationUniqueIndex : Migration
{
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.DropIndex(
            name: "IX_TeacherEducations_NameOfInstitutionOrUniversity_TypeOfDegree",
            schema: "Teacher",
            table: "TeacherEducations");

        migrationBuilder.CreateIndex(
            name: "IX_TeacherEducations_TeacherId_NameOfInstitutionOrUniversity_TypeOfDegree",
            schema: "Teacher",
            table: "TeacherEducations",
            columns: new[] { "TeacherId", "NameOfInstitutionOrUniversity", "TypeOfDegree" },
            unique: true,
            filter: "[NameOfInstitutionOrUniversity] IS NOT NULL");
    }

    protected override void Down(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.DropIndex(
            name: "IX_TeacherEducations_TeacherId_NameOfInstitutionOrUniversity_TypeOfDegree",
            schema: "Teacher",
            table: "TeacherEducations");

        migrationBuilder.CreateIndex(
            name: "IX_TeacherEducations_NameOfInstitutionOrUniversity_TypeOfDegree",
            schema: "Teacher",
            table: "TeacherEducations",
            columns: new[] { "NameOfInstitutionOrUniversity", "TypeOfDegree" },
            unique: true,
            filter: "[NameOfInstitutionOrUniversity] IS NOT NULL");
    }
}
