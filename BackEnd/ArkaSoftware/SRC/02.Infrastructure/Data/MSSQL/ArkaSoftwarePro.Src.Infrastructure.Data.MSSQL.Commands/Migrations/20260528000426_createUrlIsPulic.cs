using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ArkaSoftwarePro.Src.Infrastructure.Data.MSSQL.Commands.Migrations
{
    /// <inheritdoc />
    public partial class createUrlIsPulic : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<bool>(
                name: "IsPublic",
                schema: "Seminar",
                table: "Seminars",
                type: "bit",
                nullable: false,
                defaultValue: true);

            migrationBuilder.AddColumn<string>(
                name: "RecordingVideoUrl",
                schema: "Seminar",
                table: "Seminars",
                type: "nvarchar(500)",
                maxLength: 500,
                nullable: true);

            migrationBuilder.AddColumn<bool>(
                name: "IsIgnored",
                table: "RoomSessions",
                type: "bit",
                nullable: false,
                defaultValue: false);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "IsPublic",
                schema: "Seminar",
                table: "Seminars");

            migrationBuilder.DropColumn(
                name: "RecordingVideoUrl",
                schema: "Seminar",
                table: "Seminars");

            migrationBuilder.DropColumn(
                name: "IsIgnored",
                table: "RoomSessions");
        }
    }
}
