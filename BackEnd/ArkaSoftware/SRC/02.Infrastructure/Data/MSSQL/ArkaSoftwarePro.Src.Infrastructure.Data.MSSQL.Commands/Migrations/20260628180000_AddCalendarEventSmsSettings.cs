using Microsoft.EntityFrameworkCore.Migrations;
using Microsoft.EntityFrameworkCore.Infrastructure;

#nullable disable

using ArkaSoftwarePro.Src.Infrastructure.Data.MSSQL.Commands.Common;

namespace ArkaSoftwarePro.Src.Infrastructure.Data.MSSQL.Commands.Migrations;

[DbContext(typeof(ArkaSoftwareCommandDbContext))]
[Migration("20260628180000_AddCalendarEventSmsSettings")]
public partial class AddCalendarEventSmsSettings : Migration
{
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.AddColumn<bool>(
            name: "CalendarEventSmsEnabled",
            schema: "Website",
            table: "NotificationSettings",
            type: "bit",
            nullable: false,
            defaultValue: false);

        migrationBuilder.AddColumn<int>(
            name: "CalendarEventVerifyTemplateId",
            schema: "Website",
            table: "NotificationSettings",
            type: "int",
            nullable: false,
            defaultValue: 0);

        migrationBuilder.AddColumn<string>(
            name: "CalendarEventMessageTemplate",
            schema: "Website",
            table: "NotificationSettings",
            type: "NVARCHAR(MAX)",
            nullable: false,
            defaultValue: "یادآور آرکا نرم افزار: رویداد شما با عنوان #TITLE# در تاریخ #DATE#، ساعت #TIME# برگزار خواهد شد. تیم پشتیبانی آرکا نرم‌افزار");

        migrationBuilder.AddColumn<string>(
            name: "CalendarEventReminderMinutesJson",
            schema: "Website",
            table: "NotificationSettings",
            type: "NVARCHAR(500)",
            maxLength: 500,
            nullable: false,
            defaultValue: "[60,30]");

        migrationBuilder.Sql("""
            IF OBJECT_ID(N'[Calendar].[CalendarEventReminderDispatches]', N'U') IS NOT NULL
            BEGIN
                IF COL_LENGTH('Calendar.CalendarEventReminderDispatches', 'ReminderType') IS NOT NULL
                   AND COL_LENGTH('Calendar.CalendarEventReminderDispatches', 'MinutesBefore') IS NULL
                BEGIN
                    EXEC sp_rename N'[Calendar].[CalendarEventReminderDispatches].[ReminderType]', N'MinutesBefore', 'COLUMN';
                END

                IF EXISTS (
                    SELECT 1 FROM sys.indexes
                    WHERE name = N'IX_CalendarEventReminderDispatches_CalendarEventId_UserId_ReminderType'
                      AND object_id = OBJECT_ID(N'[Calendar].[CalendarEventReminderDispatches]')
                )
                BEGIN
                    EXEC sp_rename N'[Calendar].[CalendarEventReminderDispatches].[IX_CalendarEventReminderDispatches_CalendarEventId_UserId_ReminderType]',
                        N'IX_CalendarEventReminderDispatches_CalendarEventId_UserId_MinutesBefore', N'INDEX';
                END
            END
            """);
    }

    protected override void Down(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.RenameIndex(
            name: "IX_CalendarEventReminderDispatches_CalendarEventId_UserId_MinutesBefore",
            schema: "Calendar",
            table: "CalendarEventReminderDispatches",
            newName: "IX_CalendarEventReminderDispatches_CalendarEventId_UserId_ReminderType");

        migrationBuilder.RenameColumn(
            name: "MinutesBefore",
            schema: "Calendar",
            table: "CalendarEventReminderDispatches",
            newName: "ReminderType");

        migrationBuilder.DropColumn(name: "CalendarEventReminderMinutesJson", schema: "Website", table: "NotificationSettings");
        migrationBuilder.DropColumn(name: "CalendarEventMessageTemplate", schema: "Website", table: "NotificationSettings");
        migrationBuilder.DropColumn(name: "CalendarEventVerifyTemplateId", schema: "Website", table: "NotificationSettings");
        migrationBuilder.DropColumn(name: "CalendarEventSmsEnabled", schema: "Website", table: "NotificationSettings");
    }
}
