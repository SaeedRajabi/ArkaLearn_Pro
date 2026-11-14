using Microsoft.EntityFrameworkCore.Migrations;
using Microsoft.EntityFrameworkCore.Infrastructure;
using ArkaSoftwarePro.Src.Infrastructure.Data.MSSQL.Commands.Common;

#nullable disable

namespace ArkaSoftwarePro.Src.Infrastructure.Data.MSSQL.Commands.Migrations;

[DbContext(typeof(ArkaSoftwareCommandDbContext))]
[Migration("20260704120000_AddContactUsPages")]
public partial class AddContactUsPages : Migration
{
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.CreateTable(
            name: "ContactUsPages",
            schema: "Website",
            columns: table => new
            {
                Id = table.Column<long>(type: "bigint", nullable: false)
                    .Annotation("SqlServer:Identity", "1, 1"),
                PageTitle = table.Column<string>(type: "NVARCHAR(200)", maxLength: 200, nullable: false),
                PageSubtitle = table.Column<string>(type: "NVARCHAR(500)", maxLength: 500, nullable: false),
                HeroTitle = table.Column<string>(type: "NVARCHAR(200)", maxLength: 200, nullable: false),
                HeroSubtitle = table.Column<string>(type: "NVARCHAR(500)", maxLength: 500, nullable: false),
                HeadquartersTitle = table.Column<string>(type: "NVARCHAR(200)", maxLength: 200, nullable: false),
                HeadquartersAddress = table.Column<string>(type: "NVARCHAR(500)", maxLength: 500, nullable: false),
                HeadquartersPhone = table.Column<string>(type: "NVARCHAR(50)", maxLength: 50, nullable: false),
                HeadquartersEmail = table.Column<string>(type: "NVARCHAR(200)", maxLength: 200, nullable: false),
                ContactInfoTitle = table.Column<string>(type: "NVARCHAR(200)", maxLength: 200, nullable: false),
                ContactInfoPhone = table.Column<string>(type: "NVARCHAR(50)", maxLength: 50, nullable: false),
                ContactInfoEmail = table.Column<string>(type: "NVARCHAR(200)", maxLength: 200, nullable: false),
                SalesSupportTitle = table.Column<string>(type: "NVARCHAR(200)", maxLength: 200, nullable: false),
                SalesSupportPhone = table.Column<string>(type: "NVARCHAR(50)", maxLength: 50, nullable: false),
                SalesSupportEmail = table.Column<string>(type: "NVARCHAR(200)", maxLength: 200, nullable: false),
                FormTitle = table.Column<string>(type: "NVARCHAR(200)", maxLength: 200, nullable: false),
                FormDescription = table.Column<string>(type: "NVARCHAR(1000)", maxLength: 1000, nullable: false),
                MapEmbedUrl = table.Column<string>(type: "NVARCHAR(1000)", maxLength: 1000, nullable: false),
                FacebookUrl = table.Column<string>(type: "NVARCHAR(500)", maxLength: 500, nullable: false),
                TwitterUrl = table.Column<string>(type: "NVARCHAR(500)", maxLength: 500, nullable: false),
                InstagramUrl = table.Column<string>(type: "NVARCHAR(500)", maxLength: 500, nullable: false),
                LinkedInUrl = table.Column<string>(type: "NVARCHAR(500)", maxLength: 500, nullable: false),
                CreatedByUserId = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: true),
                CreatedDateTime = table.Column<DateTime>(type: "datetime2", nullable: true),
                ModifiedByUserId = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: true),
                ModifiedDateTime = table.Column<DateTime>(type: "datetime2", nullable: true),
                IsDelete = table.Column<bool>(type: "bit", nullable: false),
                BusinessId = table.Column<Guid>(type: "uniqueidentifier", nullable: false)
            },
            constraints: table =>
            {
                table.PrimaryKey("PK_ContactUsPages", x => x.Id);
            });
    }

    protected override void Down(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.DropTable(name: "ContactUsPages", schema: "Website");
    }
}
