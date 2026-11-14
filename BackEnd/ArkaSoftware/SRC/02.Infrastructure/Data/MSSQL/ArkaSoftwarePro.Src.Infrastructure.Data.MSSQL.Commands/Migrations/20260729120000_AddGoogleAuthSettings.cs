using Microsoft.EntityFrameworkCore.Migrations;
using Microsoft.EntityFrameworkCore.Infrastructure;
using ArkaSoftwarePro.Src.Infrastructure.Data.MSSQL.Commands.Common;

#nullable disable

namespace ArkaSoftwarePro.Src.Infrastructure.Data.MSSQL.Commands.Migrations;

[DbContext(typeof(ArkaSoftwareCommandDbContext))]
[Migration("20260729120000_AddGoogleAuthSettings")]
public partial class AddGoogleAuthSettings : Migration
{
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.CreateTable(
            name: "GoogleAuthSettings",
            schema: "Website",
            columns: table => new
            {
                Id = table.Column<long>(type: "bigint", nullable: false)
                    .Annotation("SqlServer:Identity", "1, 1"),
                IsEnabled = table.Column<bool>(type: "bit", nullable: false),
                ClientId = table.Column<string>(type: "NVARCHAR(1000)", maxLength: 1000, nullable: false),
                ClientSecret = table.Column<string>(type: "NVARCHAR(1000)", maxLength: 1000, nullable: false),
                CreatedByUserId = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: true),
                CreatedDateTime = table.Column<DateTime>(type: "datetime2", nullable: true),
                ModifiedByUserId = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: true),
                ModifiedDateTime = table.Column<DateTime>(type: "datetime2", nullable: true),
                IsDelete = table.Column<bool>(type: "bit", nullable: false),
                BusinessId = table.Column<Guid>(type: "uniqueidentifier", nullable: false)
            },
            constraints: table =>
            {
                table.PrimaryKey("PK_GoogleAuthSettings", x => x.Id);
            });
    }

    protected override void Down(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.DropTable(name: "GoogleAuthSettings", schema: "Website");
    }
}
