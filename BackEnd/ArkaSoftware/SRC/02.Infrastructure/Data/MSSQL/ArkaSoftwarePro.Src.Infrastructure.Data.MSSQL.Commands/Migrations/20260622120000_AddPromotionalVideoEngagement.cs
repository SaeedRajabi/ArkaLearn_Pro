using Microsoft.EntityFrameworkCore.Migrations;
using Microsoft.EntityFrameworkCore.Infrastructure;

#nullable disable

using ArkaSoftwarePro.Src.Infrastructure.Data.MSSQL.Commands.Common;

namespace ArkaSoftwarePro.Src.Infrastructure.Data.MSSQL.Commands.Migrations;

[DbContext(typeof(ArkaSoftwareCommandDbContext))]
[Migration("20260622120000_AddPromotionalVideoEngagement")]
public partial class AddPromotionalVideoEngagement : Migration
{
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.AddColumn<int>(
            name: "ViewCount",
            schema: "Teacher",
            table: "PromotionalVideos",
            type: "int",
            nullable: false,
            defaultValue: 0);

        migrationBuilder.AddColumn<int>(
            name: "LikeCount",
            schema: "Teacher",
            table: "PromotionalVideos",
            type: "int",
            nullable: false,
            defaultValue: 0);

        migrationBuilder.CreateTable(
            name: "PromotionalVideoLikes",
            schema: "Teacher",
            columns: table => new
            {
                Id = table.Column<long>(type: "bigint", nullable: false)
                    .Annotation("SqlServer:Identity", "1, 1"),
                VideoId = table.Column<long>(type: "bigint", nullable: false),
                UserId = table.Column<long>(type: "bigint", nullable: false),
                CreatedByUserId = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: true),
                CreatedDateTime = table.Column<DateTime>(type: "datetime2", nullable: true),
                ModifiedByUserId = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: true),
                ModifiedDateTime = table.Column<DateTime>(type: "datetime2", nullable: true),
                IsDelete = table.Column<bool>(type: "bit", nullable: false),
                BusinessId = table.Column<Guid>(type: "uniqueidentifier", nullable: false)
            },
            constraints: table =>
            {
                table.PrimaryKey("PK_PromotionalVideoLikes", x => x.Id);
            });

        migrationBuilder.CreateTable(
            name: "PromotionalVideoComments",
            schema: "Teacher",
            columns: table => new
            {
                Id = table.Column<long>(type: "bigint", nullable: false)
                    .Annotation("SqlServer:Identity", "1, 1"),
                VideoId = table.Column<long>(type: "bigint", nullable: false),
                UserId = table.Column<long>(type: "bigint", nullable: false),
                Content = table.Column<string>(type: "nvarchar(2000)", maxLength: 2000, nullable: false),
                ParentId = table.Column<long>(type: "bigint", nullable: true),
                CreatedByUserId = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: true),
                CreatedDateTime = table.Column<DateTime>(type: "datetime2", nullable: true),
                ModifiedByUserId = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: true),
                ModifiedDateTime = table.Column<DateTime>(type: "datetime2", nullable: true),
                IsDelete = table.Column<bool>(type: "bit", nullable: false),
                BusinessId = table.Column<Guid>(type: "uniqueidentifier", nullable: false)
            },
            constraints: table =>
            {
                table.PrimaryKey("PK_PromotionalVideoComments", x => x.Id);
            });

        migrationBuilder.CreateIndex(
            name: "IX_PromotionalVideoLikes_VideoId_UserId",
            schema: "Teacher",
            table: "PromotionalVideoLikes",
            columns: new[] { "VideoId", "UserId" },
            unique: true);

        migrationBuilder.CreateIndex(
            name: "IX_PromotionalVideoComments_VideoId",
            schema: "Teacher",
            table: "PromotionalVideoComments",
            column: "VideoId");

        migrationBuilder.CreateIndex(
            name: "IX_PromotionalVideoComments_ParentId",
            schema: "Teacher",
            table: "PromotionalVideoComments",
            column: "ParentId");
    }

    protected override void Down(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.DropTable(name: "PromotionalVideoComments", schema: "Teacher");
        migrationBuilder.DropTable(name: "PromotionalVideoLikes", schema: "Teacher");
        migrationBuilder.DropColumn(name: "ViewCount", schema: "Teacher", table: "PromotionalVideos");
        migrationBuilder.DropColumn(name: "LikeCount", schema: "Teacher", table: "PromotionalVideos");
    }
}
