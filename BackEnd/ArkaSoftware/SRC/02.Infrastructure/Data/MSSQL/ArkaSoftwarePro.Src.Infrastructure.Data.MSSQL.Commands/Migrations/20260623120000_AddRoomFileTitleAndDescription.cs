using Microsoft.EntityFrameworkCore.Migrations;
using Microsoft.EntityFrameworkCore.Infrastructure;

#nullable disable

using ArkaSoftwarePro.Src.Infrastructure.Data.MSSQL.Commands.Common;

namespace ArkaSoftwarePro.Src.Infrastructure.Data.MSSQL.Commands.Migrations
{
    [DbContext(typeof(ArkaSoftwareCommandDbContext))]
[Migration("20260623120000_AddRoomFileTitleAndDescription")]
public partial class AddRoomFileTitleAndDescription : Migration
    {
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "Description",
                schema: "Room",
                table: "RoomFiles",
                type: "nvarchar(1000)",
                maxLength: 1000,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Title",
                schema: "Room",
                table: "RoomFiles",
                type: "nvarchar(200)",
                maxLength: 200,
                nullable: false,
                defaultValue: "");

            migrationBuilder.Sql("""
                UPDATE [Room].[RoomFiles]
                SET [Title] = CASE
                    WHEN NULLIF(LTRIM(RTRIM([FileName])), '') IS NULL THEN 'File'
                    WHEN CHARINDEX('.', REVERSE([FileName])) > 0
                        THEN LEFT([FileName], LEN([FileName]) - CHARINDEX('.', REVERSE([FileName])))
                    ELSE [FileName]
                END
                WHERE NULLIF(LTRIM(RTRIM([Title])), '') IS NULL
                """);
        }

        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "Description",
                schema: "Room",
                table: "RoomFiles");

            migrationBuilder.DropColumn(
                name: "Title",
                schema: "Room",
                table: "RoomFiles");
        }
    }
}
