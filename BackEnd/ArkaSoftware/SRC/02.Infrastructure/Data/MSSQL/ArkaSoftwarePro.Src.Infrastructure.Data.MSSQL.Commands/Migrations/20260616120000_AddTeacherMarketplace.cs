using System;
using Microsoft.EntityFrameworkCore.Migrations;
using Microsoft.EntityFrameworkCore.Infrastructure;

#nullable disable

using ArkaSoftwarePro.Src.Infrastructure.Data.MSSQL.Commands.Common;

namespace ArkaSoftwarePro.Src.Infrastructure.Data.MSSQL.Commands.Migrations
{
    [DbContext(typeof(ArkaSoftwareCommandDbContext))]
[Migration("20260616120000_AddTeacherMarketplace")]
public partial class AddTeacherMarketplace : Migration
    {
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "TeachingCategories",
                schema: "Teacher",
                columns: table => new
                {
                    Id = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    Name = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: false),
                    Slug = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: false),
                    Description = table.Column<string>(type: "nvarchar(1000)", maxLength: 1000, nullable: true),
                    IsActive = table.Column<bool>(type: "bit", nullable: false),
                    SortOrder = table.Column<int>(type: "int", nullable: false),
                    CreatedByUserId = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: true),
                    CreatedDateTime = table.Column<DateTime>(type: "datetime2", nullable: true),
                    ModifiedByUserId = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: true),
                    ModifiedDateTime = table.Column<DateTime>(type: "datetime2", nullable: true),
                    IsDelete = table.Column<bool>(type: "bit", nullable: false),
                    BusinessId = table.Column<Guid>(type: "uniqueidentifier", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_TeachingCategories", x => x.Id);
                });

            migrationBuilder.CreateIndex(
                name: "IX_TeachingCategories_Slug",
                schema: "Teacher",
                table: "TeachingCategories",
                column: "Slug",
                unique: true);

            migrationBuilder.AddColumn<string>(
                name: "ShortDescription",
                schema: "Teacher",
                table: "Teachers",
                type: "nvarchar(500)",
                maxLength: 500,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "HeaderImageUrl",
                schema: "Teacher",
                table: "Teachers",
                type: "nvarchar(2000)",
                maxLength: 2000,
                nullable: true);

            migrationBuilder.AddColumn<long>(
                name: "TeachingCategoryId",
                schema: "Teacher",
                table: "Teachers",
                type: "bigint",
                nullable: true);

            migrationBuilder.AddColumn<byte>(
                name: "AdvertisingPlan",
                schema: "Teacher",
                table: "Teachers",
                type: "tinyint",
                nullable: false,
                defaultValue: (byte)0);

            migrationBuilder.AddColumn<byte>(
                name: "ProfileApprovalStatus",
                schema: "Teacher",
                table: "Teachers",
                type: "tinyint",
                nullable: false,
                defaultValue: (byte)0);

            migrationBuilder.AddColumn<string>(
                name: "ProfileRejectionNote",
                schema: "Teacher",
                table: "Teachers",
                type: "nvarchar(2000)",
                maxLength: 2000,
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "SubmittedAtUtc",
                schema: "Teacher",
                table: "Teachers",
                type: "datetime2",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "ApprovedAtUtc",
                schema: "Teacher",
                table: "Teachers",
                type: "datetime2",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_Teachers_TeachingCategoryId",
                schema: "Teacher",
                table: "Teachers",
                column: "TeachingCategoryId");

            migrationBuilder.AddForeignKey(
                name: "FK_Teachers_TeachingCategories_TeachingCategoryId",
                schema: "Teacher",
                table: "Teachers",
                column: "TeachingCategoryId",
                principalSchema: "Teacher",
                principalTable: "TeachingCategories",
                principalColumn: "Id",
                onDelete: ReferentialAction.SetNull);

            migrationBuilder.CreateTable(
                name: "PromotionalVideos",
                schema: "Teacher",
                columns: table => new
                {
                    Id = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    TeacherId = table.Column<long>(type: "bigint", nullable: false),
                    Title = table.Column<string>(type: "nvarchar(300)", maxLength: 300, nullable: false),
                    VideoUrl = table.Column<string>(type: "nvarchar(2000)", maxLength: 2000, nullable: false),
                    ThumbnailUrl = table.Column<string>(type: "nvarchar(2000)", maxLength: 2000, nullable: true),
                    ApprovalStatus = table.Column<byte>(type: "tinyint", nullable: false),
                    SortOrder = table.Column<int>(type: "int", nullable: false),
                    CreatedByUserId = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: true),
                    CreatedDateTime = table.Column<DateTime>(type: "datetime2", nullable: true),
                    ModifiedByUserId = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: true),
                    ModifiedDateTime = table.Column<DateTime>(type: "datetime2", nullable: true),
                    IsDelete = table.Column<bool>(type: "bit", nullable: false),
                    BusinessId = table.Column<Guid>(type: "uniqueidentifier", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_PromotionalVideos", x => x.Id);
                    table.ForeignKey(
                        name: "FK_PromotionalVideos_Teachers_TeacherId",
                        column: x => x.TeacherId,
                        principalSchema: "Teacher",
                        principalTable: "Teachers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "Books",
                schema: "Teacher",
                columns: table => new
                {
                    Id = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    TeacherId = table.Column<long>(type: "bigint", nullable: false),
                    Title = table.Column<string>(type: "nvarchar(300)", maxLength: 300, nullable: false),
                    Description = table.Column<string>(type: "nvarchar(4000)", maxLength: 4000, nullable: false),
                    CoverImageUrl = table.Column<string>(type: "nvarchar(2000)", maxLength: 2000, nullable: true),
                    ApprovalStatus = table.Column<byte>(type: "tinyint", nullable: false),
                    SortOrder = table.Column<int>(type: "int", nullable: false),
                    CreatedByUserId = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: true),
                    CreatedDateTime = table.Column<DateTime>(type: "datetime2", nullable: true),
                    ModifiedByUserId = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: true),
                    ModifiedDateTime = table.Column<DateTime>(type: "datetime2", nullable: true),
                    IsDelete = table.Column<bool>(type: "bit", nullable: false),
                    BusinessId = table.Column<Guid>(type: "uniqueidentifier", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Books", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Books_Teachers_TeacherId",
                        column: x => x.TeacherId,
                        principalSchema: "Teacher",
                        principalTable: "Teachers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "PortfolioArticles",
                schema: "Teacher",
                columns: table => new
                {
                    Id = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    TeacherId = table.Column<long>(type: "bigint", nullable: false),
                    Title = table.Column<string>(type: "nvarchar(300)", maxLength: 300, nullable: false),
                    Summary = table.Column<string>(type: "nvarchar(1000)", maxLength: 1000, nullable: false),
                    Content = table.Column<string>(type: "NVARCHAR(MAX)", nullable: false),
                    ApprovalStatus = table.Column<byte>(type: "tinyint", nullable: false),
                    SortOrder = table.Column<int>(type: "int", nullable: false),
                    CreatedByUserId = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: true),
                    CreatedDateTime = table.Column<DateTime>(type: "datetime2", nullable: true),
                    ModifiedByUserId = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: true),
                    ModifiedDateTime = table.Column<DateTime>(type: "datetime2", nullable: true),
                    IsDelete = table.Column<bool>(type: "bit", nullable: false),
                    BusinessId = table.Column<Guid>(type: "uniqueidentifier", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_PortfolioArticles", x => x.Id);
                    table.ForeignKey(
                        name: "FK_PortfolioArticles_Teachers_TeacherId",
                        column: x => x.TeacherId,
                        principalSchema: "Teacher",
                        principalTable: "Teachers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.Sql("""
                IF NOT EXISTS (SELECT 1 FROM [Teacher].[TeachingCategories])
                BEGIN
                    INSERT INTO [Teacher].[TeachingCategories]
                        ([Name], [Slug], [Description], [IsActive], [SortOrder], [CreatedDateTime], [IsDelete], [BusinessId])
                    VALUES
                        (N'Programming', N'programming', N'Software and programming instructors', 1, 1, SYSUTCDATETIME(), 0, NEWID()),
                        (N'English', N'english', N'English language instructors', 1, 2, SYSUTCDATETIME(), 0, NEWID()),
                        (N'Mathematics', N'mathematics', N'Mathematics instructors', 1, 3, SYSUTCDATETIME(), 0, NEWID()),
                        (N'Science', N'science', N'Science instructors', 1, 4, SYSUTCDATETIME(), 0, NEWID()),
                        (N'Art & Design', N'art-design', N'Art and design instructors', 1, 5, SYSUTCDATETIME(), 0, NEWID());
                END
                """);
        }

        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(name: "PortfolioArticles", schema: "Teacher");
            migrationBuilder.DropTable(name: "Books", schema: "Teacher");
            migrationBuilder.DropTable(name: "PromotionalVideos", schema: "Teacher");
            migrationBuilder.DropForeignKey(name: "FK_Teachers_TeachingCategories_TeachingCategoryId", schema: "Teacher", table: "Teachers");
            migrationBuilder.DropIndex(name: "IX_Teachers_TeachingCategoryId", schema: "Teacher", table: "Teachers");
            migrationBuilder.DropColumn(name: "ShortDescription", schema: "Teacher", table: "Teachers");
            migrationBuilder.DropColumn(name: "HeaderImageUrl", schema: "Teacher", table: "Teachers");
            migrationBuilder.DropColumn(name: "TeachingCategoryId", schema: "Teacher", table: "Teachers");
            migrationBuilder.DropColumn(name: "AdvertisingPlan", schema: "Teacher", table: "Teachers");
            migrationBuilder.DropColumn(name: "ProfileApprovalStatus", schema: "Teacher", table: "Teachers");
            migrationBuilder.DropColumn(name: "ProfileRejectionNote", schema: "Teacher", table: "Teachers");
            migrationBuilder.DropColumn(name: "SubmittedAtUtc", schema: "Teacher", table: "Teachers");
            migrationBuilder.DropColumn(name: "ApprovedAtUtc", schema: "Teacher", table: "Teachers");
            migrationBuilder.DropTable(name: "TeachingCategories", schema: "Teacher");
        }
    }
}
