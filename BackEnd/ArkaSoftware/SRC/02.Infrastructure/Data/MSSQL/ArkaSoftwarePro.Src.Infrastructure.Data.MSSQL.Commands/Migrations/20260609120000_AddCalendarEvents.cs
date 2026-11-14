using Microsoft.EntityFrameworkCore.Migrations;
using Microsoft.EntityFrameworkCore.Infrastructure;

#nullable disable

using ArkaSoftwarePro.Src.Infrastructure.Data.MSSQL.Commands.Common;

namespace ArkaSoftwarePro.Src.Infrastructure.Data.MSSQL.Commands.Migrations;

[DbContext(typeof(ArkaSoftwareCommandDbContext))]
[Migration("20260609120000_AddCalendarEvents")]
public partial class AddCalendarEvents : Migration
{
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.EnsureSchema(name: "Calendar");

        migrationBuilder.CreateTable(
            name: "CalendarEvents",
            schema: "Calendar",
            columns: table => new
            {
                Id = table.Column<long>(type: "bigint", nullable: false)
                    .Annotation("SqlServer:Identity", "1, 1"),
                Title = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: false),
                Category = table.Column<int>(type: "int", nullable: false),
                StartUtc = table.Column<DateTime>(type: "datetime2", nullable: false),
                EndUtc = table.Column<DateTime>(type: "datetime2", nullable: false),
                IsAllDay = table.Column<bool>(type: "bit", nullable: false, defaultValue: false),
                EventUrl = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: true),
                Description = table.Column<string>(type: "nvarchar(4000)", maxLength: 4000, nullable: true),
                OwnerUserId = table.Column<long>(type: "bigint", nullable: false),
                CreatedByUserId = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: true),
                CreatedDateTime = table.Column<DateTime>(type: "datetime2", nullable: true),
                ModifiedByUserId = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: true),
                ModifiedDateTime = table.Column<DateTime>(type: "datetime2", nullable: true),
                IsDelete = table.Column<bool>(type: "bit", nullable: false),
                BusinessId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
            },
            constraints: table =>
            {
                table.PrimaryKey("PK_CalendarEvents", x => x.Id);
                table.UniqueConstraint("AK_CalendarEvents_BusinessId", x => x.BusinessId);
            });

        migrationBuilder.CreateTable(
            name: "CalendarEventParticipants",
            schema: "Calendar",
            columns: table => new
            {
                Id = table.Column<long>(type: "bigint", nullable: false)
                    .Annotation("SqlServer:Identity", "1, 1"),
                CalendarEventId = table.Column<long>(type: "bigint", nullable: false),
                UserId = table.Column<long>(type: "bigint", nullable: false),
                CreatedByUserId = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: true),
                CreatedDateTime = table.Column<DateTime>(type: "datetime2", nullable: true),
                ModifiedByUserId = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: true),
                ModifiedDateTime = table.Column<DateTime>(type: "datetime2", nullable: true),
                IsDelete = table.Column<bool>(type: "bit", nullable: false),
                BusinessId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
            },
            constraints: table =>
            {
                table.PrimaryKey("PK_CalendarEventParticipants", x => x.Id);
                table.UniqueConstraint("AK_CalendarEventParticipants_BusinessId", x => x.BusinessId);
                table.ForeignKey(
                    name: "FK_CalendarEventParticipants_CalendarEvents_CalendarEventId",
                    column: x => x.CalendarEventId,
                    principalSchema: "Calendar",
                    principalTable: "CalendarEvents",
                    principalColumn: "Id",
                    onDelete: ReferentialAction.Cascade);
            });

        migrationBuilder.CreateTable(
            name: "CalendarEventReminderDispatches",
            schema: "Calendar",
            columns: table => new
            {
                Id = table.Column<long>(type: "bigint", nullable: false)
                    .Annotation("SqlServer:Identity", "1, 1"),
                CalendarEventId = table.Column<long>(type: "bigint", nullable: false),
                UserId = table.Column<long>(type: "bigint", nullable: false),
                ReminderType = table.Column<int>(type: "int", nullable: false),
                SentAtUtc = table.Column<DateTime>(type: "datetime2", nullable: false),
                CreatedByUserId = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: true),
                CreatedDateTime = table.Column<DateTime>(type: "datetime2", nullable: true),
                ModifiedByUserId = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: true),
                ModifiedDateTime = table.Column<DateTime>(type: "datetime2", nullable: true),
                IsDelete = table.Column<bool>(type: "bit", nullable: false),
                BusinessId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
            },
            constraints: table =>
            {
                table.PrimaryKey("PK_CalendarEventReminderDispatches", x => x.Id);
                table.UniqueConstraint("AK_CalendarEventReminderDispatches_BusinessId", x => x.BusinessId);
            });

        migrationBuilder.CreateIndex(
            name: "IX_CalendarEvents_OwnerUserId",
            schema: "Calendar",
            table: "CalendarEvents",
            column: "OwnerUserId");

        migrationBuilder.CreateIndex(
            name: "IX_CalendarEvents_IsDelete_StartUtc_EndUtc",
            schema: "Calendar",
            table: "CalendarEvents",
            columns: new[] { "IsDelete", "StartUtc", "EndUtc" });

        migrationBuilder.CreateIndex(
            name: "IX_CalendarEventParticipants_CalendarEventId_UserId",
            schema: "Calendar",
            table: "CalendarEventParticipants",
            columns: new[] { "CalendarEventId", "UserId" },
            unique: true);

        migrationBuilder.CreateIndex(
            name: "IX_CalendarEventParticipants_UserId",
            schema: "Calendar",
            table: "CalendarEventParticipants",
            column: "UserId");

        migrationBuilder.CreateIndex(
            name: "IX_CalendarEventReminderDispatches_CalendarEventId_UserId_ReminderType",
            schema: "Calendar",
            table: "CalendarEventReminderDispatches",
            columns: new[] { "CalendarEventId", "UserId", "ReminderType" },
            unique: true);
    }

    protected override void Down(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.DropTable(name: "CalendarEventParticipants", schema: "Calendar");
        migrationBuilder.DropTable(name: "CalendarEventReminderDispatches", schema: "Calendar");
        migrationBuilder.DropTable(name: "CalendarEvents", schema: "Calendar");
    }
}
