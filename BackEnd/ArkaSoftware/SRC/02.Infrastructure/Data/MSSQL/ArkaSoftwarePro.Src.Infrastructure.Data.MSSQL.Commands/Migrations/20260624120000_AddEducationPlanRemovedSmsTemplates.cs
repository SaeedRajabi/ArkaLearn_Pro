using Microsoft.EntityFrameworkCore.Migrations;
using Microsoft.EntityFrameworkCore.Infrastructure;

#nullable disable

using ArkaSoftwarePro.Src.Infrastructure.Data.MSSQL.Commands.Common;

namespace ArkaSoftwarePro.Src.Infrastructure.Data.MSSQL.Commands.Migrations
{
    [DbContext(typeof(ArkaSoftwareCommandDbContext))]
[Migration("20260624120000_AddEducationPlanRemovedSmsTemplates")]
public partial class AddEducationPlanRemovedSmsTemplates : Migration
    {
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "EducationPlanRemovedMessageTemplate",
                schema: "Website",
                table: "NotificationSettings",
                type: "NVARCHAR(MAX)",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<int>(
                name: "EducationPlanRemovedVerifyTemplateId",
                schema: "Website",
                table: "NotificationSettings",
                type: "int",
                nullable: false,
                defaultValue: 0);
        }

        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "EducationPlanRemovedMessageTemplate",
                schema: "Website",
                table: "NotificationSettings");

            migrationBuilder.DropColumn(
                name: "EducationPlanRemovedVerifyTemplateId",
                schema: "Website",
                table: "NotificationSettings");
        }
    }
}
