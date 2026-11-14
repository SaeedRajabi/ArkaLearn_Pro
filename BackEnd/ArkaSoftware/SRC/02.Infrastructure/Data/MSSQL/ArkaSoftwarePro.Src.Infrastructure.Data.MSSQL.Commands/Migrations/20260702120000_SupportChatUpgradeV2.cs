using Microsoft.EntityFrameworkCore.Migrations;
using Microsoft.EntityFrameworkCore.Infrastructure;

#nullable disable

using ArkaSoftwarePro.Src.Infrastructure.Data.MSSQL.Commands.Common;

namespace ArkaSoftwarePro.Src.Infrastructure.Data.MSSQL.Commands.Migrations;

[DbContext(typeof(ArkaSoftwareCommandDbContext))]
[Migration("20260702120000_SupportChatUpgradeV2")]
public partial class SupportChatUpgradeV2 : Migration
{
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.AddColumn<int>(
            name: "SupportChatUnreadSmsDelayMinutes",
            schema: "Website",
            table: "NotificationSettings",
            type: "int",
            nullable: false,
            defaultValue: 10);

        migrationBuilder.AddColumn<string>(
            name: "SupportChatNotificationSoundKey",
            schema: "Website",
            table: "NotificationSettings",
            type: "nvarchar(32)",
            maxLength: 32,
            nullable: false,
            defaultValue: "chime");

        migrationBuilder.CreateTable(
            name: "SupportChatSmsReminders",
            schema: "Support",
            columns: table => new
            {
                Id = table.Column<long>(type: "bigint", nullable: false)
                    .Annotation("SqlServer:Identity", "1, 1"),
                ConversationId = table.Column<long>(type: "bigint", nullable: false),
                MessageId = table.Column<long>(type: "bigint", nullable: false),
                RecipientUserId = table.Column<long>(type: "bigint", nullable: false),
                SenderUserId = table.Column<long>(type: "bigint", nullable: false),
                SenderDisplayName = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: false),
                Subject = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: false),
                MessageSentAtUtc = table.Column<DateTime>(type: "datetime2", nullable: false),
                ScheduledAtUtc = table.Column<DateTime>(type: "datetime2", nullable: false),
                SentAtUtc = table.Column<DateTime>(type: "datetime2", nullable: true),
                CancelledAtUtc = table.Column<DateTime>(type: "datetime2", nullable: true),
                IsDelete = table.Column<bool>(type: "bit", nullable: false)
            },
            constraints: table => table.PrimaryKey("PK_SupportChatSmsReminders", x => x.Id));

        migrationBuilder.CreateTable(
            name: "SupportConversationRatings",
            schema: "Support",
            columns: table => new
            {
                Id = table.Column<long>(type: "bigint", nullable: false)
                    .Annotation("SqlServer:Identity", "1, 1"),
                ConversationId = table.Column<long>(type: "bigint", nullable: false),
                StudentUserId = table.Column<long>(type: "bigint", nullable: false),
                TeacherUserId = table.Column<long>(type: "bigint", nullable: false),
                Level = table.Column<byte>(type: "tinyint", nullable: false),
                ScorePoints = table.Column<int>(type: "int", nullable: false),
                Feedback = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: true),
                RatedAtUtc = table.Column<DateTime>(type: "datetime2", nullable: false),
                IsDelete = table.Column<bool>(type: "bit", nullable: false)
            },
            constraints: table => table.PrimaryKey("PK_SupportConversationRatings", x => x.Id));

        migrationBuilder.CreateIndex(
            name: "IX_SupportChatSmsReminders_ConversationId_RecipientUserId",
            schema: "Support",
            table: "SupportChatSmsReminders",
            columns: new[] { "ConversationId", "RecipientUserId" });

        migrationBuilder.CreateIndex(
            name: "IX_SupportChatSmsReminders_RecipientUserId_ScheduledAtUtc",
            schema: "Support",
            table: "SupportChatSmsReminders",
            columns: new[] { "RecipientUserId", "ScheduledAtUtc" });

        migrationBuilder.CreateIndex(
            name: "IX_SupportConversationRatings_ConversationId",
            schema: "Support",
            table: "SupportConversationRatings",
            column: "ConversationId",
            unique: true);

        migrationBuilder.CreateIndex(
            name: "IX_SupportConversationRatings_TeacherUserId",
            schema: "Support",
            table: "SupportConversationRatings",
            column: "TeacherUserId");
    }

    protected override void Down(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.DropTable(name: "SupportConversationRatings", schema: "Support");
        migrationBuilder.DropTable(name: "SupportChatSmsReminders", schema: "Support");
        migrationBuilder.DropColumn(name: "SupportChatUnreadSmsDelayMinutes", schema: "Website", table: "NotificationSettings");
        migrationBuilder.DropColumn(name: "SupportChatNotificationSoundKey", schema: "Website", table: "NotificationSettings");
    }
}
