using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;
using ArkaSoftwarePro.Src.Infrastructure.Data.MSSQL.Commands.Common;

#nullable disable

namespace ArkaSoftwarePro.Src.Infrastructure.Data.MSSQL.Commands.Migrations;

[DbContext(typeof(ArkaSoftwareCommandDbContext))]
[Migration("20261031120000_AddEducationPlanInstallmentReminderRules")]
public partial class AddEducationPlanInstallmentReminderRules : Migration
{
    private const string DefaultRulesJson =
        "[{\"offsetDays\":-1,\"sendStudentSms\":true,\"sendStudentEmail\":true,\"sendTeacherEmail\":true}," +
        "{\"offsetDays\":0,\"sendStudentSms\":true,\"sendStudentEmail\":true,\"sendTeacherEmail\":false}]";

    protected override void Up(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.AddColumn<string>(
            name: "EducationPlanInstallmentReminderRulesJson",
            schema: "Website",
            table: "NotificationSettings",
            type: "NVARCHAR(MAX)",
            nullable: false,
            defaultValue: DefaultRulesJson);

        migrationBuilder.AddColumn<string>(
            name: "ReminderSentOffsetsJson",
            schema: "Education",
            table: "EducationPlanInstallments",
            type: "NVARCHAR(200)",
            maxLength: 200,
            nullable: false,
            defaultValue: "[]");

        migrationBuilder.Sql("""
            UPDATE [Education].[EducationPlanInstallments]
            SET [ReminderSentOffsetsJson] = N'[0]'
            WHERE [ReminderSentAtUtc] IS NOT NULL
              AND ([ReminderSentOffsetsJson] IS NULL OR [ReminderSentOffsetsJson] = N'[]');
            """);
    }

    protected override void Down(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.DropColumn(
            name: "EducationPlanInstallmentReminderRulesJson",
            schema: "Website",
            table: "NotificationSettings");

        migrationBuilder.DropColumn(
            name: "ReminderSentOffsetsJson",
            schema: "Education",
            table: "EducationPlanInstallments");
    }
}
