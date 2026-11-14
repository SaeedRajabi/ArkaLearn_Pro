using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ArkaSoftwarePro.Src.Infrastructure.Data.MSSQL.Commands.Migrations;

public partial class AddDatabaseConnectionSettings : Migration
{
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.CreateTable(
            name: "DatabaseConnectionSettings",
            schema: "Website",
            columns: table => new
            {
                Id = table.Column<long>(type: "bigint", nullable: false)
                    .Annotation("SqlServer:Identity", "1, 1"),
                UseDatabaseConnection = table.Column<bool>(type: "bit", nullable: false, defaultValue: false),
                Server = table.Column<string>(type: "nvarchar(256)", maxLength: 256, nullable: false, defaultValue: "localhost"),
                Port = table.Column<int>(type: "int", nullable: true),
                Database = table.Column<string>(type: "nvarchar(256)", maxLength: 256, nullable: false, defaultValue: ""),
                UserId = table.Column<string>(type: "nvarchar(128)", maxLength: 128, nullable: false, defaultValue: ""),
                PasswordEncrypted = table.Column<string>(type: "nvarchar(512)", maxLength: 512, nullable: true),
                TrustServerCertificate = table.Column<bool>(type: "bit", nullable: false, defaultValue: true),
                MultipleActiveResultSets = table.Column<bool>(type: "bit", nullable: false, defaultValue: true),
                CreatedByUserId = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: true),
                CreatedDateTime = table.Column<DateTime>(type: "datetime2", nullable: true),
                ModifiedByUserId = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: true),
                ModifiedDateTime = table.Column<DateTime>(type: "datetime2", nullable: true),
                IsDelete = table.Column<bool>(type: "bit", nullable: false),
                BusinessId = table.Column<Guid>(type: "uniqueidentifier", nullable: false)
            },
            constraints: table =>
            {
                table.PrimaryKey("PK_DatabaseConnectionSettings", x => x.Id);
            });
    }

    protected override void Down(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.DropTable(name: "DatabaseConnectionSettings", schema: "Website");
    }
}
