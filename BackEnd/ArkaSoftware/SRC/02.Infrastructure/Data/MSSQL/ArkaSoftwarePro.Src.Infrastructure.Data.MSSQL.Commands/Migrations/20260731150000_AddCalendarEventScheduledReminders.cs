using Microsoft.EntityFrameworkCore.Migrations;
using Microsoft.EntityFrameworkCore.Infrastructure;

#nullable disable

using ArkaSoftwarePro.Src.Infrastructure.Data.MSSQL.Commands.Common;

namespace ArkaSoftwarePro.Src.Infrastructure.Data.MSSQL.Commands.Migrations;

[DbContext(typeof(ArkaSoftwareCommandDbContext))]
[Migration("20260731150000_AddCalendarEventScheduledReminders")]
public partial class AddCalendarEventScheduledReminders : Migration
{
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.CreateTable(
            name: "CalendarEventScheduledReminders",
            schema: "Calendar",
            columns: table => new
            {
                Id = table.Column<long>(type: "bigint", nullable: false)
                    .Annotation("SqlServer:Identity", "1, 1"),
                CalendarEventId = table.Column<long>(type: "bigint", nullable: false),
                UserId = table.Column<long>(type: "bigint", nullable: false),
                MinutesBefore = table.Column<int>(type: "int", nullable: false),
                ScheduledAtUtc = table.Column<DateTime>(type: "datetime2", nullable: false),
                SentAtUtc = table.Column<DateTime>(type: "datetime2", nullable: true),
                CancelledAtUtc = table.Column<DateTime>(type: "datetime2", nullable: true),
                CreatedByUserId = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: true),
                CreatedDateTime = table.Column<DateTime>(type: "datetime2", nullable: true),
                ModifiedByUserId = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: true),
                ModifiedDateTime = table.Column<DateTime>(type: "datetime2", nullable: true),
                IsDelete = table.Column<bool>(type: "bit", nullable: false),
                BusinessId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
            },
            constraints: table =>
            {
                table.PrimaryKey("PK_CalendarEventScheduledReminders", x => x.Id);
                table.UniqueConstraint("AK_CalendarEventScheduledReminders_BusinessId", x => x.BusinessId);
            });

        migrationBuilder.CreateIndex(
            name: "IX_CalendarEventScheduledReminders_CalendarEventId_UserId_MinutesBefore",
            schema: "Calendar",
            table: "CalendarEventScheduledReminders",
            columns: new[] { "CalendarEventId", "UserId", "MinutesBefore" });

        migrationBuilder.CreateIndex(
            name: "IX_CalendarEventScheduledReminders_ScheduledAtUtc_SentAtUtc_CancelledAtUtc",
            schema: "Calendar",
            table: "CalendarEventScheduledReminders",
            columns: new[] { "ScheduledAtUtc", "SentAtUtc", "CancelledAtUtc" });
    }

    protected override void Down(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.DropTable(
            name: "CalendarEventScheduledReminders",
            schema: "Calendar");
    }
}
