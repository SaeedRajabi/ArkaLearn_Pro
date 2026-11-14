using System;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;
using ArkaSoftwarePro.Src.Infrastructure.Data.MSSQL.Commands.Common;

#nullable disable

namespace ArkaSoftwarePro.Src.Infrastructure.Data.MSSQL.Commands.Migrations;

[DbContext(typeof(ArkaSoftwareCommandDbContext))]
[Migration("20260915120000_AddPlatformSupportTickets")]
public partial class AddPlatformSupportTickets : Migration
{
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.AddColumn<string>(
            name: "TicketSource",
            table: "SupportTickets",
            type: "nvarchar(20)",
            maxLength: 20,
            nullable: false,
            defaultValue: "Contact");

        migrationBuilder.AddColumn<string>(
            name: "Department",
            table: "SupportTickets",
            type: "nvarchar(50)",
            maxLength: 50,
            nullable: false,
            defaultValue: "");

        migrationBuilder.AddColumn<long>(
            name: "RequesterUserId",
            table: "SupportTickets",
            type: "bigint",
            nullable: true);

        migrationBuilder.AddColumn<DateTime>(
            name: "FirstViewedAtUtc",
            table: "SupportTickets",
            type: "datetime2",
            nullable: true);

        migrationBuilder.AddColumn<long>(
            name: "FirstViewedByUserId",
            table: "SupportTickets",
            type: "bigint",
            nullable: true);

        migrationBuilder.AddColumn<DateTime>(
            name: "ClosedAtUtc",
            table: "SupportTickets",
            type: "datetime2",
            nullable: true);

        migrationBuilder.AddColumn<int>(
            name: "Rating",
            table: "SupportTickets",
            type: "int",
            nullable: true);

        migrationBuilder.AddColumn<string>(
            name: "RatingComment",
            table: "SupportTickets",
            type: "nvarchar(1000)",
            maxLength: 1000,
            nullable: true);

        migrationBuilder.AddColumn<DateTime>(
            name: "LastMessageAtUtc",
            table: "SupportTickets",
            type: "datetime2",
            nullable: true);

        migrationBuilder.AddColumn<string>(
            name: "LastMessagePreview",
            table: "SupportTickets",
            type: "nvarchar(200)",
            maxLength: 200,
            nullable: true);

        migrationBuilder.CreateTable(
            name: "SupportTicketMessages",
            columns: table => new
            {
                Id = table.Column<long>(type: "bigint", nullable: false)
                    .Annotation("SqlServer:Identity", "1, 1"),
                TicketId = table.Column<long>(type: "bigint", nullable: false),
                SenderUserId = table.Column<long>(type: "bigint", nullable: false),
                IsStaffMessage = table.Column<bool>(type: "bit", nullable: false, defaultValue: false),
                ContentHtml = table.Column<string>(type: "NVARCHAR(MAX)", nullable: false),
                SentAtUtc = table.Column<DateTime>(type: "datetime2", nullable: false),
                ReplyToMessageId = table.Column<long>(type: "bigint", nullable: true),
                EditedAtUtc = table.Column<DateTime>(type: "datetime2", nullable: true),
                BusinessId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                CreatedByUserId = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: true),
                CreatedDateTime = table.Column<DateTime>(type: "datetime2", nullable: true),
                ModifiedByUserId = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: true),
                ModifiedDateTime = table.Column<DateTime>(type: "datetime2", nullable: true),
                IsDelete = table.Column<bool>(type: "bit", nullable: false)
            },
            constraints: table =>
            {
                table.PrimaryKey("PK_SupportTicketMessages", x => x.Id);
                table.ForeignKey(
                    name: "FK_SupportTicketMessages_SupportTickets_TicketId",
                    column: x => x.TicketId,
                    principalTable: "SupportTickets",
                    principalColumn: "Id",
                    onDelete: ReferentialAction.Cascade);
            });

        migrationBuilder.CreateIndex(
            name: "IX_SupportTickets_RequesterUserId",
            table: "SupportTickets",
            column: "RequesterUserId");

        migrationBuilder.CreateIndex(
            name: "IX_SupportTickets_TicketSource",
            table: "SupportTickets",
            column: "TicketSource");

        migrationBuilder.CreateIndex(
            name: "IX_SupportTickets_TicketSource_Status_LastMessageAtUtc",
            table: "SupportTickets",
            columns: new[] { "TicketSource", "Status", "LastMessageAtUtc" });

        migrationBuilder.CreateIndex(
            name: "IX_SupportTicketMessages_TicketId",
            table: "SupportTicketMessages",
            column: "TicketId");

        migrationBuilder.CreateIndex(
            name: "IX_SupportTicketMessages_TicketId_SentAtUtc",
            table: "SupportTicketMessages",
            columns: new[] { "TicketId", "SentAtUtc" });
    }

    protected override void Down(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.DropTable(name: "SupportTicketMessages");

        migrationBuilder.DropIndex(name: "IX_SupportTickets_RequesterUserId", table: "SupportTickets");
        migrationBuilder.DropIndex(name: "IX_SupportTickets_TicketSource", table: "SupportTickets");
        migrationBuilder.DropIndex(name: "IX_SupportTickets_TicketSource_Status_LastMessageAtUtc", table: "SupportTickets");

        migrationBuilder.DropColumn(name: "TicketSource", table: "SupportTickets");
        migrationBuilder.DropColumn(name: "Department", table: "SupportTickets");
        migrationBuilder.DropColumn(name: "RequesterUserId", table: "SupportTickets");
        migrationBuilder.DropColumn(name: "FirstViewedAtUtc", table: "SupportTickets");
        migrationBuilder.DropColumn(name: "FirstViewedByUserId", table: "SupportTickets");
        migrationBuilder.DropColumn(name: "ClosedAtUtc", table: "SupportTickets");
        migrationBuilder.DropColumn(name: "Rating", table: "SupportTickets");
        migrationBuilder.DropColumn(name: "RatingComment", table: "SupportTickets");
        migrationBuilder.DropColumn(name: "LastMessageAtUtc", table: "SupportTickets");
        migrationBuilder.DropColumn(name: "LastMessagePreview", table: "SupportTickets");
    }
}
