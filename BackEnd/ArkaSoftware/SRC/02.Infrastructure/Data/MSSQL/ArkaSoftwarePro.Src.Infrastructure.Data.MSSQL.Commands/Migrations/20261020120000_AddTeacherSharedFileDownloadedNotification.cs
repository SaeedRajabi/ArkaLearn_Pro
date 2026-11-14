using Microsoft.EntityFrameworkCore.Migrations;
using Microsoft.EntityFrameworkCore.Infrastructure;

#nullable disable

using ArkaSoftwarePro.Src.Infrastructure.Data.MSSQL.Commands.Common;

namespace ArkaSoftwarePro.Src.Infrastructure.Data.MSSQL.Commands.Migrations;

[DbContext(typeof(ArkaSoftwareCommandDbContext))]
[Migration("20261020120000_AddTeacherSharedFileDownloadedNotification")]
public partial class AddTeacherSharedFileDownloadedNotification : Migration
{
    private const string DefaultTemplate =
        "دانشجو #FULLNAME# فایل «#TITLE#» را دانلود کرد.";

    protected override void Up(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.AddColumn<bool>(
            name: "TeacherSharedFileDownloadedEnabled",
            schema: "Website",
            table: "NotificationSettings",
            type: "bit",
            nullable: false,
            defaultValue: false);

        migrationBuilder.AddColumn<int>(
            name: "TeacherSharedFileDownloadedVerifyTemplateId",
            schema: "Website",
            table: "NotificationSettings",
            type: "int",
            nullable: false,
            defaultValue: 0);

        migrationBuilder.AddColumn<string>(
            name: "TeacherSharedFileDownloadedMessageTemplate",
            schema: "Website",
            table: "NotificationSettings",
            type: "NVARCHAR(MAX)",
            nullable: false,
            defaultValue: "");

        migrationBuilder.Sql($"""
            UPDATE [Website].[NotificationSettings]
            SET [TeacherSharedFileDownloadedMessageTemplate] = N'{DefaultTemplate.Replace("'", "''")}'
            WHERE [TeacherSharedFileDownloadedMessageTemplate] IS NULL
               OR LTRIM(RTRIM([TeacherSharedFileDownloadedMessageTemplate])) = N'';
            """);
    }

    protected override void Down(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.DropColumn(name: "TeacherSharedFileDownloadedEnabled", schema: "Website", table: "NotificationSettings");
        migrationBuilder.DropColumn(name: "TeacherSharedFileDownloadedVerifyTemplateId", schema: "Website", table: "NotificationSettings");
        migrationBuilder.DropColumn(name: "TeacherSharedFileDownloadedMessageTemplate", schema: "Website", table: "NotificationSettings");
    }
}
