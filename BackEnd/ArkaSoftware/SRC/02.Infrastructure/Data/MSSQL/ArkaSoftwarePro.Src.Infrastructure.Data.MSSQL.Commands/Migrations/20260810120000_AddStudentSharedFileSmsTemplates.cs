using Microsoft.EntityFrameworkCore.Migrations;
using Microsoft.EntityFrameworkCore.Infrastructure;

#nullable disable

using ArkaSoftwarePro.Src.Infrastructure.Data.MSSQL.Commands.Common;

namespace ArkaSoftwarePro.Src.Infrastructure.Data.MSSQL.Commands.Migrations;

[DbContext(typeof(ArkaSoftwareCommandDbContext))]
[Migration("20260810120000_AddStudentSharedFileSmsTemplates")]
public partial class AddStudentSharedFileSmsTemplates : Migration
{
    private const string DefaultTemplate =
        "فایل جلسه با عنوان #TITLE# برای شما بارگذاری شد. 📥\n" +
        "برای دانلود، به بخش \"داشبورد\" و سپس \"فایل‌های اشتراکی\" مراجعه نمایید.\n" +
        " تیم پشتیبانی آرکا نرم‌افزار";

    protected override void Up(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.AddColumn<bool>(
            name: "StudentSharedFileSmsEnabled",
            schema: "Website",
            table: "NotificationSettings",
            type: "bit",
            nullable: false,
            defaultValue: false);

        migrationBuilder.AddColumn<int>(
            name: "StudentSharedFileVerifyTemplateId",
            schema: "Website",
            table: "NotificationSettings",
            type: "int",
            nullable: false,
            defaultValue: 0);

        migrationBuilder.AddColumn<string>(
            name: "StudentSharedFileMessageTemplate",
            schema: "Website",
            table: "NotificationSettings",
            type: "NVARCHAR(MAX)",
            nullable: false,
            defaultValue: "");

        migrationBuilder.Sql($"""
            UPDATE [Website].[NotificationSettings]
            SET [StudentSharedFileMessageTemplate] = N'{DefaultTemplate.Replace("'", "''")}'
            WHERE [StudentSharedFileMessageTemplate] IS NULL
               OR LTRIM(RTRIM([StudentSharedFileMessageTemplate])) = N'';
            """);
    }

    protected override void Down(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.DropColumn(name: "StudentSharedFileSmsEnabled", schema: "Website", table: "NotificationSettings");
        migrationBuilder.DropColumn(name: "StudentSharedFileVerifyTemplateId", schema: "Website", table: "NotificationSettings");
        migrationBuilder.DropColumn(name: "StudentSharedFileMessageTemplate", schema: "Website", table: "NotificationSettings");
    }
}
