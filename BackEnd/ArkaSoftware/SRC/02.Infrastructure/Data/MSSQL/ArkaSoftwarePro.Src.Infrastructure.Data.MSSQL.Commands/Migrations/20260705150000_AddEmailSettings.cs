using Microsoft.EntityFrameworkCore.Migrations;
using Microsoft.EntityFrameworkCore.Infrastructure;
using ArkaSoftwarePro.Src.Infrastructure.Data.MSSQL.Commands.Common;

#nullable disable

namespace ArkaSoftwarePro.Src.Infrastructure.Data.MSSQL.Commands.Migrations;

[DbContext(typeof(ArkaSoftwareCommandDbContext))]
[Migration("20260705150000_AddEmailSettings")]
public partial class AddEmailSettings : Migration
{
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.CreateTable(
            name: "EmailSettings",
            schema: "Website",
            columns: table => new
            {
                Id = table.Column<long>(type: "bigint", nullable: false)
                    .Annotation("SqlServer:Identity", "1, 1"),
                IsEnabled = table.Column<bool>(type: "bit", nullable: false),
                Host = table.Column<string>(type: "NVARCHAR(500)", maxLength: 500, nullable: false),
                Port = table.Column<int>(type: "int", nullable: false),
                UseSsl = table.Column<bool>(type: "bit", nullable: false),
                UseStartTls = table.Column<bool>(type: "bit", nullable: false),
                AllowInvalidCertificate = table.Column<bool>(type: "bit", nullable: false),
                Username = table.Column<string>(type: "NVARCHAR(500)", maxLength: 500, nullable: false),
                Password = table.Column<string>(type: "NVARCHAR(500)", maxLength: 500, nullable: false),
                FromEmail = table.Column<string>(type: "NVARCHAR(500)", maxLength: 500, nullable: false),
                FromName = table.Column<string>(type: "NVARCHAR(200)", maxLength: 200, nullable: false),
                TimeoutSeconds = table.Column<int>(type: "int", nullable: false),
                RequireEmailVerification = table.Column<bool>(type: "bit", nullable: false, defaultValue: true),
                OtpExpiryMinutes = table.Column<int>(type: "int", nullable: false),
                OtpResendCooldownSeconds = table.Column<int>(type: "int", nullable: false),
                CreatedByUserId = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: true),
                CreatedDateTime = table.Column<DateTime>(type: "datetime2", nullable: true),
                ModifiedByUserId = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: true),
                ModifiedDateTime = table.Column<DateTime>(type: "datetime2", nullable: true),
                IsDelete = table.Column<bool>(type: "bit", nullable: false),
                BusinessId = table.Column<Guid>(type: "uniqueidentifier", nullable: false)
            },
            constraints: table =>
            {
                table.PrimaryKey("PK_EmailSettings", x => x.Id);
            });
    }

    protected override void Down(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.DropTable(name: "EmailSettings", schema: "Website");
    }
}
