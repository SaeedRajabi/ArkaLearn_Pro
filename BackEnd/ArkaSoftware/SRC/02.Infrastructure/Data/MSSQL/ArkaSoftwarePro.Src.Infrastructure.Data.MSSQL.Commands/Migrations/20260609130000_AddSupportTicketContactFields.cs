using System;
using Microsoft.EntityFrameworkCore.Migrations;
using Microsoft.EntityFrameworkCore.Infrastructure;

#nullable disable

using ArkaSoftwarePro.Src.Infrastructure.Data.MSSQL.Commands.Common;

namespace ArkaSoftwarePro.Src.Infrastructure.Data.MSSQL.Commands.Migrations
{
    /// <inheritdoc />
    [DbContext(typeof(ArkaSoftwareCommandDbContext))]
[Migration("20260609130000_AddSupportTicketContactFields")]
public partial class AddSupportTicketContactFields : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "AdminReply",
                table: "SupportTickets",
                type: "NVARCHAR(MAX)",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "RequesterEmail",
                table: "SupportTickets",
                type: "nvarchar(320)",
                maxLength: 320,
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<DateTime>(
                name: "RepliedAt",
                table: "SupportTickets",
                type: "datetime2",
                nullable: true);

            migrationBuilder.AddColumn<long>(
                name: "RepliedByUserId",
                table: "SupportTickets",
                type: "bigint",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "AdminReply",
                table: "SupportTickets");

            migrationBuilder.DropColumn(
                name: "RequesterEmail",
                table: "SupportTickets");

            migrationBuilder.DropColumn(
                name: "RepliedAt",
                table: "SupportTickets");

            migrationBuilder.DropColumn(
                name: "RepliedByUserId",
                table: "SupportTickets");
        }
    }
}
