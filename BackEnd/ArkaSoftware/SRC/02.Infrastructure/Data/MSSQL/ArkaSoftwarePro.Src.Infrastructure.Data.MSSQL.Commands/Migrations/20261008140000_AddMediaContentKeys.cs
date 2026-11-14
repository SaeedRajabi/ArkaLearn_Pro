using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ArkaSoftwarePro.Src.Infrastructure.Data.MSSQL.Commands.Migrations;

[Migration("20261008140000_AddMediaContentKeys")]
public partial class AddMediaContentKeys : Migration
{
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.CreateTable(
            name: "MediaContentKeys",
            schema: "Desktop",
            columns: table => new
            {
                Id = table.Column<long>(type: "bigint", nullable: false)
                    .Annotation("SqlServer:Identity", "1, 1"),
                KeyId = table.Column<string>(type: "nvarchar(64)", maxLength: 64, nullable: false),
                MediaAssetId = table.Column<long>(type: "bigint", nullable: false),
                ProtectedKeyMaterial = table.Column<string>(type: "nvarchar(512)", maxLength: 512, nullable: false),
                CreatedAtUtc = table.Column<DateTime>(type: "datetime2", nullable: false),
                IsDeleted = table.Column<bool>(type: "bit", nullable: false, defaultValue: false),
            },
            constraints: table =>
            {
                table.PrimaryKey("PK_MediaContentKeys", x => x.Id);
            });

        migrationBuilder.CreateIndex(
            name: "IX_MediaContentKeys_KeyId",
            schema: "Desktop",
            table: "MediaContentKeys",
            column: "KeyId",
            unique: true);

        migrationBuilder.CreateIndex(
            name: "IX_MediaContentKeys_MediaAssetId",
            schema: "Desktop",
            table: "MediaContentKeys",
            column: "MediaAssetId");
    }

    protected override void Down(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.DropTable(name: "MediaContentKeys", schema: "Desktop");
    }
}
