using Microsoft.EntityFrameworkCore.Migrations;
using Microsoft.EntityFrameworkCore.Infrastructure;

#nullable disable

using ArkaSoftwarePro.Src.Infrastructure.Data.MSSQL.Commands.Common;

namespace ArkaSoftwarePro.Src.Infrastructure.Data.MSSQL.Commands.Migrations;

[DbContext(typeof(ArkaSoftwareCommandDbContext))]
[Migration("20260709130000_SupportChatMessageActions")]
public partial class SupportChatMessageActions : Migration
{
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.AddColumn<DateTime>(
            name: "EditedAtUtc",
            schema: "Support",
            table: "SupportMessages",
            type: "datetime2",
            nullable: true);

        migrationBuilder.AddColumn<long>(
            name: "ReplyToMessageId",
            schema: "Support",
            table: "SupportMessages",
            type: "bigint",
            nullable: true);

        migrationBuilder.CreateIndex(
            name: "IX_SupportMessages_ReplyToMessageId",
            schema: "Support",
            table: "SupportMessages",
            column: "ReplyToMessageId");
    }

    protected override void Down(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.DropIndex(
            name: "IX_SupportMessages_ReplyToMessageId",
            schema: "Support",
            table: "SupportMessages");

        migrationBuilder.DropColumn(
            name: "EditedAtUtc",
            schema: "Support",
            table: "SupportMessages");

        migrationBuilder.DropColumn(
            name: "ReplyToMessageId",
            schema: "Support",
            table: "SupportMessages");
    }
}
