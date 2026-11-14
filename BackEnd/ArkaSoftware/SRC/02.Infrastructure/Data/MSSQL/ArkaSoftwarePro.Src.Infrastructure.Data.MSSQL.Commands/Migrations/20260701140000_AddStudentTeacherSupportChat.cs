using Microsoft.EntityFrameworkCore.Migrations;
using Microsoft.EntityFrameworkCore.Infrastructure;

#nullable disable

using ArkaSoftwarePro.Src.Infrastructure.Data.MSSQL.Commands.Common;

namespace ArkaSoftwarePro.Src.Infrastructure.Data.MSSQL.Commands.Migrations;

[DbContext(typeof(ArkaSoftwareCommandDbContext))]
[Migration("20260701140000_AddStudentTeacherSupportChat")]
public partial class AddStudentTeacherSupportChat : Migration
{
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.EnsureSchema(name: "Support");

        migrationBuilder.CreateTable(
            name: "SupportConversations",
            schema: "Support",
            columns: table => new
            {
                Id = table.Column<long>(type: "bigint", nullable: false)
                    .Annotation("SqlServer:Identity", "1, 1"),
                StudentUserId = table.Column<long>(type: "bigint", nullable: false),
                TeacherUserId = table.Column<long>(type: "bigint", nullable: false),
                Subject = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: false),
                Status = table.Column<byte>(type: "tinyint", nullable: false),
                CreatedAtUtc = table.Column<DateTime>(type: "datetime2", nullable: false),
                LastMessageAtUtc = table.Column<DateTime>(type: "datetime2", nullable: true),
                StudentLastReadAtUtc = table.Column<DateTime>(type: "datetime2", nullable: true),
                TeacherLastReadAtUtc = table.Column<DateTime>(type: "datetime2", nullable: true),
                IsDelete = table.Column<bool>(type: "bit", nullable: false)
            },
            constraints: table => table.PrimaryKey("PK_SupportConversations", x => x.Id));

        migrationBuilder.CreateTable(
            name: "SupportMessages",
            schema: "Support",
            columns: table => new
            {
                Id = table.Column<long>(type: "bigint", nullable: false)
                    .Annotation("SqlServer:Identity", "1, 1"),
                ConversationId = table.Column<long>(type: "bigint", nullable: false),
                SenderUserId = table.Column<long>(type: "bigint", nullable: false),
                ContentHtml = table.Column<string>(type: "NVARCHAR(MAX)", nullable: false),
                SentAtUtc = table.Column<DateTime>(type: "datetime2", nullable: false),
                IsDelete = table.Column<bool>(type: "bit", nullable: false)
            },
            constraints: table =>
            {
                table.PrimaryKey("PK_SupportMessages", x => x.Id);
                table.ForeignKey(
                    name: "FK_SupportMessages_SupportConversations_ConversationId",
                    column: x => x.ConversationId,
                    principalSchema: "Support",
                    principalTable: "SupportConversations",
                    principalColumn: "Id",
                    onDelete: ReferentialAction.Cascade);
            });

        migrationBuilder.CreateIndex(
            name: "IX_SupportConversations_StudentUserId",
            schema: "Support",
            table: "SupportConversations",
            column: "StudentUserId");

        migrationBuilder.CreateIndex(
            name: "IX_SupportConversations_TeacherUserId",
            schema: "Support",
            table: "SupportConversations",
            column: "TeacherUserId");

        migrationBuilder.CreateIndex(
            name: "IX_SupportConversations_StudentUserId_TeacherUserId_CreatedAtUtc",
            schema: "Support",
            table: "SupportConversations",
            columns: new[] { "StudentUserId", "TeacherUserId", "CreatedAtUtc" });

        migrationBuilder.CreateIndex(
            name: "IX_SupportMessages_ConversationId",
            schema: "Support",
            table: "SupportMessages",
            column: "ConversationId");

        migrationBuilder.CreateIndex(
            name: "IX_SupportMessages_ConversationId_SentAtUtc",
            schema: "Support",
            table: "SupportMessages",
            columns: new[] { "ConversationId", "SentAtUtc" });

        migrationBuilder.AddColumn<bool>(
            name: "SupportChatSmsEnabled",
            schema: "Website",
            table: "NotificationSettings",
            type: "bit",
            nullable: false,
            defaultValue: false);

        migrationBuilder.AddColumn<int>(
            name: "SupportChatVerifyTemplateId",
            schema: "Website",
            table: "NotificationSettings",
            type: "int",
            nullable: false,
            defaultValue: 0);

        migrationBuilder.AddColumn<string>(
            name: "SupportChatMessageTemplate",
            schema: "Website",
            table: "NotificationSettings",
            type: "NVARCHAR(MAX)",
            nullable: false,
            defaultValue: "");
    }

    protected override void Down(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.DropTable(name: "SupportMessages", schema: "Support");
        migrationBuilder.DropTable(name: "SupportConversations", schema: "Support");

        migrationBuilder.DropColumn(name: "SupportChatSmsEnabled", schema: "Website", table: "NotificationSettings");
        migrationBuilder.DropColumn(name: "SupportChatVerifyTemplateId", schema: "Website", table: "NotificationSettings");
        migrationBuilder.DropColumn(name: "SupportChatMessageTemplate", schema: "Website", table: "NotificationSettings");
    }
}
