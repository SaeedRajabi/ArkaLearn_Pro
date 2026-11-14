using Microsoft.EntityFrameworkCore.Migrations;
using Microsoft.EntityFrameworkCore.Infrastructure;
using ArkaSoftwarePro.Src.Infrastructure.Data.MSSQL.Commands.Common;

#nullable disable

namespace ArkaSoftwarePro.Src.Infrastructure.Data.MSSQL.Commands.Migrations;

[DbContext(typeof(ArkaSoftwareCommandDbContext))]
[Migration("20260720210000_AddNewsletterSubscribers")]
public partial class AddNewsletterSubscribers : Migration
{
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.CreateTable(
            name: "NewsletterSubscribers",
            schema: "Website",
            columns: table => new
            {
                Id = table.Column<long>(type: "bigint", nullable: false)
                    .Annotation("SqlServer:Identity", "1, 1"),
                Email = table.Column<string>(type: "NVARCHAR(256)", maxLength: 256, nullable: false),
                IsVerified = table.Column<bool>(type: "bit", nullable: false),
                UserId = table.Column<long>(type: "bigint", nullable: true),
                VerifiedAtUtc = table.Column<DateTime>(type: "datetime2", nullable: true),
                UnsubscribedAtUtc = table.Column<DateTime>(type: "datetime2", nullable: true),
                CreatedByUserId = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: true),
                CreatedDateTime = table.Column<DateTime>(type: "datetime2", nullable: true),
                ModifiedByUserId = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: true),
                ModifiedDateTime = table.Column<DateTime>(type: "datetime2", nullable: true),
                IsDelete = table.Column<bool>(type: "bit", nullable: false),
                BusinessId = table.Column<Guid>(type: "uniqueidentifier", nullable: false)
            },
            constraints: table =>
            {
                table.PrimaryKey("PK_NewsletterSubscribers", x => x.Id);
            });

        migrationBuilder.CreateIndex(
            name: "IX_NewsletterSubscribers_Email",
            schema: "Website",
            table: "NewsletterSubscribers",
            column: "Email",
            unique: true);
    }

    protected override void Down(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.DropTable(name: "NewsletterSubscribers", schema: "Website");
    }
}
