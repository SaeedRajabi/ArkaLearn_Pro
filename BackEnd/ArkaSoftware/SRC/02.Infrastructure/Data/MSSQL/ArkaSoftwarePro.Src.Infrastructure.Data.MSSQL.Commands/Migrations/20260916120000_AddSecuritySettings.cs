using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ArkaSoftwarePro.Src.Infrastructure.Data.MSSQL.Commands.Migrations;

public partial class AddSecuritySettings : Migration
{
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.CreateTable(
            name: "SecuritySettings",
            schema: "Website",
            columns: table => new
            {
                Id = table.Column<long>(type: "bigint", nullable: false)
                    .Annotation("SqlServer:Identity", "1, 1"),
                MaxLoginAttempts = table.Column<int>(type: "int", nullable: false, defaultValue: 5),
                LockoutMinutes = table.Column<int>(type: "int", nullable: false, defaultValue: 15),
                PermanentBlockAfterLockouts = table.Column<int>(type: "int", nullable: false, defaultValue: 2),
                IpUnblockOtpExpiryMinutes = table.Column<int>(type: "int", nullable: false, defaultValue: 10),
                IpUnblockOtpResendCooldownSeconds = table.Column<int>(type: "int", nullable: false, defaultValue: 120),
                CreatedByUserId = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: true),
                CreatedDateTime = table.Column<DateTime>(type: "datetime2", nullable: true),
                ModifiedByUserId = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: true),
                ModifiedDateTime = table.Column<DateTime>(type: "datetime2", nullable: true),
                IsDelete = table.Column<bool>(type: "bit", nullable: false),
                BusinessId = table.Column<Guid>(type: "uniqueidentifier", nullable: false)
            },
            constraints: table =>
            {
                table.PrimaryKey("PK_SecuritySettings", x => x.Id);
            });
    }

    protected override void Down(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.DropTable(name: "SecuritySettings", schema: "Website");
    }
}
