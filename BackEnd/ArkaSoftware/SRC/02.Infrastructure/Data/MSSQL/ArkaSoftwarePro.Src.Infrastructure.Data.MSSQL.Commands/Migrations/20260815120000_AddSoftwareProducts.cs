using Microsoft.EntityFrameworkCore.Migrations;
using Microsoft.EntityFrameworkCore.Infrastructure;

#nullable disable

using ArkaSoftwarePro.Src.Infrastructure.Data.MSSQL.Commands.Common;

namespace ArkaSoftwarePro.Src.Infrastructure.Data.MSSQL.Commands.Migrations;

[DbContext(typeof(ArkaSoftwareCommandDbContext))]
[Migration("20260815120000_AddSoftwareProducts")]
public partial class AddSoftwareProducts : Migration
{
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.EnsureSchema(name: "Software");

        migrationBuilder.CreateTable(
            name: "Products",
            schema: "Software",
            columns: table => new
            {
                Id = table.Column<long>(type: "bigint", nullable: false)
                    .Annotation("SqlServer:Identity", "1, 1"),
                TeacherId = table.Column<long>(type: "bigint", nullable: true),
                AuthorUserId = table.Column<long>(type: "bigint", nullable: false),
                Title = table.Column<string>(type: "nvarchar(300)", maxLength: 300, nullable: false),
                Description = table.Column<string>(type: "nvarchar(1000)", maxLength: 1000, nullable: false),
                LongDescriptionHtml = table.Column<string>(type: "NVARCHAR(MAX)", nullable: false),
                CoverImageUrl = table.Column<string>(type: "nvarchar(2000)", maxLength: 2000, nullable: true),
                InstallerFileUrl = table.Column<string>(type: "nvarchar(2000)", maxLength: 2000, nullable: true),
                InstallerFileName = table.Column<string>(type: "nvarchar(260)", maxLength: 260, nullable: true),
                CategoryId = table.Column<long>(type: "bigint", nullable: true),
                Slug = table.Column<string>(type: "nvarchar(220)", maxLength: 220, nullable: false),
                TagsJson = table.Column<string>(type: "nvarchar(2000)", maxLength: 2000, nullable: false, defaultValue: "[]"),
                DownloadCount = table.Column<int>(type: "int", nullable: false, defaultValue: 0),
                LikeCount = table.Column<int>(type: "int", nullable: false, defaultValue: 0),
                ApprovalStatus = table.Column<byte>(type: "tinyint", nullable: false),
                ApprovedSnapshotJson = table.Column<string>(type: "NVARCHAR(MAX)", nullable: true),
                SortOrder = table.Column<int>(type: "int", nullable: false, defaultValue: 0),
                SeoTitle = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: true),
                MetaDescription = table.Column<string>(type: "nvarchar(320)", maxLength: 320, nullable: true),
                OgImageUrl = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: true),
                CreatedByUserId = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: true),
                CreatedDateTime = table.Column<DateTime>(type: "datetime2", nullable: true),
                ModifiedByUserId = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: true),
                ModifiedDateTime = table.Column<DateTime>(type: "datetime2", nullable: true),
                IsDelete = table.Column<bool>(type: "bit", nullable: false),
                BusinessId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
            },
            constraints: table =>
            {
                table.PrimaryKey("PK_Products", x => x.Id);
                table.UniqueConstraint("AK_Products_BusinessId", x => x.BusinessId);
                table.ForeignKey(
                    name: "FK_Products_Categories_CategoryId",
                    column: x => x.CategoryId,
                    principalSchema: "Category",
                    principalTable: "Categories",
                    principalColumn: "Id",
                    onDelete: ReferentialAction.SetNull);
                table.ForeignKey(
                    name: "FK_Products_Teachers_TeacherId",
                    column: x => x.TeacherId,
                    principalSchema: "Teacher",
                    principalTable: "Teachers",
                    principalColumn: "Id",
                    onDelete: ReferentialAction.Cascade);
            });

        migrationBuilder.CreateTable(
            name: "Likes",
            schema: "Software",
            columns: table => new
            {
                Id = table.Column<long>(type: "bigint", nullable: false)
                    .Annotation("SqlServer:Identity", "1, 1"),
                SoftwareProductId = table.Column<long>(type: "bigint", nullable: false),
                UserId = table.Column<long>(type: "bigint", nullable: false),
                CreatedByUserId = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: true),
                CreatedDateTime = table.Column<DateTime>(type: "datetime2", nullable: true),
                ModifiedByUserId = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: true),
                ModifiedDateTime = table.Column<DateTime>(type: "datetime2", nullable: true),
                IsDelete = table.Column<bool>(type: "bit", nullable: false),
                BusinessId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
            },
            constraints: table =>
            {
                table.PrimaryKey("PK_Likes", x => x.Id);
                table.ForeignKey(
                    name: "FK_Likes_Products_SoftwareProductId",
                    column: x => x.SoftwareProductId,
                    principalSchema: "Software",
                    principalTable: "Products",
                    principalColumn: "Id",
                    onDelete: ReferentialAction.Cascade);
            });

        migrationBuilder.CreateIndex(
            name: "IX_Products_Slug",
            schema: "Software",
            table: "Products",
            column: "Slug",
            unique: true);

        migrationBuilder.CreateIndex(
            name: "IX_Products_TeacherId",
            schema: "Software",
            table: "Products",
            column: "TeacherId");

        migrationBuilder.CreateIndex(
            name: "IX_Products_CategoryId",
            schema: "Software",
            table: "Products",
            column: "CategoryId");

        migrationBuilder.CreateIndex(
            name: "IX_Likes_SoftwareProductId_UserId",
            schema: "Software",
            table: "Likes",
            columns: new[] { "SoftwareProductId", "UserId" },
            unique: true);
    }

    protected override void Down(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.DropTable(name: "Likes", schema: "Software");
        migrationBuilder.DropTable(name: "Products", schema: "Software");
    }
}
