using Microsoft.EntityFrameworkCore.Migrations;
using Microsoft.EntityFrameworkCore.Infrastructure;
using ArkaSoftwarePro.Src.Infrastructure.Data.MSSQL.Commands.Common;

#nullable disable

namespace ArkaSoftwarePro.Src.Infrastructure.Data.MSSQL.Commands.Migrations;

[DbContext(typeof(ArkaSoftwareCommandDbContext))]
[Migration("20260911120000_AddSiteAnnouncements")]
public partial class AddSiteAnnouncements : Migration
{
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.CreateTable(
            name: "SiteAnnouncements",
            schema: "Website",
            columns: table => new
            {
                Id = table.Column<long>(type: "bigint", nullable: false)
                    .Annotation("SqlServer:Identity", "1, 1"),
                IsEnabled = table.Column<bool>(type: "bit", nullable: false),
                ContentHtml = table.Column<string>(type: "NVARCHAR(MAX)", nullable: false),
                TextColor = table.Column<string>(type: "NVARCHAR(20)", maxLength: 20, nullable: false),
                BackgroundType = table.Column<byte>(type: "tinyint", nullable: false),
                BackgroundColor = table.Column<string>(type: "NVARCHAR(20)", maxLength: 20, nullable: false),
                GradientStartColor = table.Column<string>(type: "NVARCHAR(20)", maxLength: 20, nullable: false),
                GradientEndColor = table.Column<string>(type: "NVARCHAR(20)", maxLength: 20, nullable: false),
                GradientAngle = table.Column<int>(type: "int", nullable: false),
                BackgroundImageUrl = table.Column<string>(type: "NVARCHAR(600)", maxLength: 600, nullable: false),
                CreatedByUserId = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: true),
                CreatedDateTime = table.Column<DateTime>(type: "datetime2", nullable: true),
                ModifiedByUserId = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: true),
                ModifiedDateTime = table.Column<DateTime>(type: "datetime2", nullable: true),
                IsDelete = table.Column<bool>(type: "bit", nullable: false),
                BusinessId = table.Column<Guid>(type: "uniqueidentifier", nullable: false)
            },
            constraints: table =>
            {
                table.PrimaryKey("PK_SiteAnnouncements", x => x.Id);
            });
    }

    protected override void Down(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.DropTable(name: "SiteAnnouncements", schema: "Website");
    }
}
