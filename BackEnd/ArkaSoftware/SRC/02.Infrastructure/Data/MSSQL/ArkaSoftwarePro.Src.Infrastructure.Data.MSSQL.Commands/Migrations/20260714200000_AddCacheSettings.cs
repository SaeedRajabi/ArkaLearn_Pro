using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ArkaSoftwarePro.Src.Infrastructure.Data.MSSQL.Commands.Migrations;

public partial class AddCacheSettings : Migration
{
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.CreateTable(
            name: "CacheSettings",
            schema: "Website",
            columns: table => new
            {
                Id = table.Column<long>(type: "bigint", nullable: false)
                    .Annotation("SqlServer:Identity", "1, 1"),
                IsEnabled = table.Column<bool>(type: "bit", nullable: false, defaultValue: true),
                Provider = table.Column<string>(type: "nvarchar(32)", maxLength: 32, nullable: false, defaultValue: "InMemory"),
                DefaultTtlMinutes = table.Column<int>(type: "int", nullable: false, defaultValue: 30),
                RedisHost = table.Column<string>(type: "nvarchar(256)", maxLength: 256, nullable: false, defaultValue: "127.0.0.1"),
                RedisPort = table.Column<int>(type: "int", nullable: false, defaultValue: 6379),
                RedisPasswordEncrypted = table.Column<string>(type: "nvarchar(512)", maxLength: 512, nullable: true),
                RedisInstanceName = table.Column<string>(type: "nvarchar(128)", maxLength: 128, nullable: false, defaultValue: "ArkaLearn:"),
                RedisUseSsl = table.Column<bool>(type: "bit", nullable: false, defaultValue: false),
                CacheCoursesEnabled = table.Column<bool>(type: "bit", nullable: false, defaultValue: true),
                CacheArticlesEnabled = table.Column<bool>(type: "bit", nullable: false, defaultValue: true),
                CacheSeminarsEnabled = table.Column<bool>(type: "bit", nullable: false, defaultValue: true),
                CacheBooksEnabled = table.Column<bool>(type: "bit", nullable: false, defaultValue: true),
                CacheSoftwareEnabled = table.Column<bool>(type: "bit", nullable: false, defaultValue: true),
                CacheTeacherAdsEnabled = table.Column<bool>(type: "bit", nullable: false, defaultValue: true),
                CacheFilesEnabled = table.Column<bool>(type: "bit", nullable: false, defaultValue: true),
                CacheCategoriesEnabled = table.Column<bool>(type: "bit", nullable: false, defaultValue: true),
                CacheTeachersEnabled = table.Column<bool>(type: "bit", nullable: false, defaultValue: true),
                CacheProjectsEnabled = table.Column<bool>(type: "bit", nullable: false, defaultValue: true),
                CreatedByUserId = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: true),
                CreatedDateTime = table.Column<DateTime>(type: "datetime2", nullable: true),
                ModifiedByUserId = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: true),
                ModifiedDateTime = table.Column<DateTime>(type: "datetime2", nullable: true),
                IsDelete = table.Column<bool>(type: "bit", nullable: false),
                BusinessId = table.Column<Guid>(type: "uniqueidentifier", nullable: false)
            },
            constraints: table =>
            {
                table.PrimaryKey("PK_CacheSettings", x => x.Id);
            });
    }

    protected override void Down(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.DropTable(name: "CacheSettings", schema: "Website");
    }
}
