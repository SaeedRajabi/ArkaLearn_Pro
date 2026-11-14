using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ArkaSoftwarePro.Src.Infrastructure.Data.MSSQL.Commands.Migrations;

public partial class AddUserActivityEvents : Migration
{
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.EnsureSchema(name: "Analytics");

        migrationBuilder.CreateTable(
            name: "UserActivityEvents",
            schema: "Analytics",
            columns: table => new
            {
                Id = table.Column<long>(type: "bigint", nullable: false)
                    .Annotation("SqlServer:Identity", "1, 1"),
                UserId = table.Column<long>(type: "bigint", nullable: true),
                VisitorKey = table.Column<string>(type: "nvarchar(128)", maxLength: 128, nullable: false),
                SubjectKey = table.Column<string>(type: "nvarchar(160)", maxLength: 160, nullable: false),
                ActionType = table.Column<string>(type: "nvarchar(64)", maxLength: 64, nullable: false),
                ActionTitle = table.Column<string>(type: "nvarchar(512)", maxLength: 512, nullable: false),
                PagePath = table.Column<string>(type: "nvarchar(1024)", maxLength: 1024, nullable: false),
                PageTitle = table.Column<string>(type: "nvarchar(512)", maxLength: 512, nullable: true),
                Referrer = table.Column<string>(type: "nvarchar(1024)", maxLength: 1024, nullable: true),
                SiteSource = table.Column<string>(type: "nvarchar(32)", maxLength: 32, nullable: false),
                IpAddressV4 = table.Column<string>(type: "nvarchar(64)", maxLength: 64, nullable: true),
                IpAddressV6 = table.Column<string>(type: "nvarchar(128)", maxLength: 128, nullable: true),
                UserAgent = table.Column<string>(type: "nvarchar(1024)", maxLength: 1024, nullable: true),
                BrowserName = table.Column<string>(type: "nvarchar(64)", maxLength: 64, nullable: true),
                BrowserVersion = table.Column<string>(type: "nvarchar(32)", maxLength: 32, nullable: true),
                OperatingSystem = table.Column<string>(type: "nvarchar(128)", maxLength: 128, nullable: true),
                DeviceType = table.Column<string>(type: "nvarchar(32)", maxLength: 32, nullable: true),
                DisplayName = table.Column<string>(type: "nvarchar(256)", maxLength: 256, nullable: false),
                OccurredAtUtc = table.Column<DateTime>(type: "datetime2", nullable: false),
                MetadataJson = table.Column<string>(type: "nvarchar(max)", nullable: true),
                CreatedByUserId = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: true),
                CreatedDateTime = table.Column<DateTime>(type: "datetime2", nullable: true),
                ModifiedByUserId = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: true),
                ModifiedDateTime = table.Column<DateTime>(type: "datetime2", nullable: true),
                IsDelete = table.Column<bool>(type: "bit", nullable: false),
                BusinessId = table.Column<Guid>(type: "uniqueidentifier", nullable: false)
            },
            constraints: table =>
            {
                table.PrimaryKey("PK_UserActivityEvents", x => x.Id);
            });

        migrationBuilder.CreateIndex(
            name: "IX_UserActivityEvents_OccurredAtUtc",
            schema: "Analytics",
            table: "UserActivityEvents",
            column: "OccurredAtUtc");

        migrationBuilder.CreateIndex(
            name: "IX_UserActivityEvents_SubjectKey",
            schema: "Analytics",
            table: "UserActivityEvents",
            column: "SubjectKey");

        migrationBuilder.CreateIndex(
            name: "IX_UserActivityEvents_SubjectKey_OccurredAtUtc",
            schema: "Analytics",
            table: "UserActivityEvents",
            columns: new[] { "SubjectKey", "OccurredAtUtc" });
    }

    protected override void Down(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.DropTable(name: "UserActivityEvents", schema: "Analytics");
    }
}
