using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ArkaSoftwarePro.Src.Infrastructure.Data.MSSQL.Commands.Migrations;

public partial class AddLiveMediaTransportSettings : Migration
{
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.CreateTable(
            name: "LiveMediaTransportSettings",
            schema: "Website",
            columns: table => new
            {
                Id = table.Column<long>(type: "bigint", nullable: false)
                    .Annotation("SqlServer:Identity", "1, 1"),
                TransportMode = table.Column<string>(type: "nvarchar(32)", maxLength: 32, nullable: false, defaultValue: "Mesh"),
                LiveKitUrl = table.Column<string>(type: "nvarchar(512)", maxLength: 512, nullable: true),
                LiveKitApiKey = table.Column<string>(type: "nvarchar(256)", maxLength: 256, nullable: true),
                LiveKitApiSecretEncrypted = table.Column<string>(type: "nvarchar(512)", maxLength: 512, nullable: true),
                CreatedByUserId = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: true),
                CreatedDateTime = table.Column<DateTime>(type: "datetime2", nullable: true),
                ModifiedByUserId = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: true),
                ModifiedDateTime = table.Column<DateTime>(type: "datetime2", nullable: true),
                IsDelete = table.Column<bool>(type: "bit", nullable: false),
                BusinessId = table.Column<Guid>(type: "uniqueidentifier", nullable: false)
            },
            constraints: table =>
            {
                table.PrimaryKey("PK_LiveMediaTransportSettings", x => x.Id);
            });
    }

    protected override void Down(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.DropTable(name: "LiveMediaTransportSettings", schema: "Website");
    }
}
