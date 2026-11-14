using System;
using Microsoft.EntityFrameworkCore.Migrations;
using Microsoft.EntityFrameworkCore.Infrastructure;

#nullable disable

using ArkaSoftwarePro.Src.Infrastructure.Data.MSSQL.Commands.Common;

namespace ArkaSoftwarePro.Src.Infrastructure.Data.MSSQL.Commands.Migrations
{
    [DbContext(typeof(ArkaSoftwareCommandDbContext))]
[Migration("20260618120000_AddTeacherAdvertisements")]
public partial class AddTeacherAdvertisements : Migration
    {
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "Advertisements",
                schema: "Teacher",
                columns: table => new
                {
                    Id = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    TeacherId = table.Column<long>(type: "bigint", nullable: false),
                    Title = table.Column<string>(type: "nvarchar(300)", maxLength: 300, nullable: false),
                    PrivateTeachingCost = table.Column<decimal>(type: "decimal(18,2)", nullable: true),
                    HourlyTeachingCost = table.Column<decimal>(type: "decimal(18,2)", nullable: true),
                    WorkExperience = table.Column<string>(type: "nvarchar(2000)", maxLength: 2000, nullable: true),
                    DescriptionHtml = table.Column<string>(type: "NVARCHAR(MAX)", nullable: false),
                    WebsiteUrl = table.Column<string>(type: "nvarchar(2000)", maxLength: 2000, nullable: true),
                    WebsiteTitle = table.Column<string>(type: "nvarchar(300)", maxLength: 300, nullable: true),
                    ContactPhone = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: true),
                    BaleLink = table.Column<string>(type: "nvarchar(2000)", maxLength: 2000, nullable: true),
                    TelegramLink = table.Column<string>(type: "nvarchar(2000)", maxLength: 2000, nullable: true),
                    WhatsAppLink = table.Column<string>(type: "nvarchar(2000)", maxLength: 2000, nullable: true),
                    GitHubLink = table.Column<string>(type: "nvarchar(2000)", maxLength: 2000, nullable: true),
                    LinkedInLink = table.Column<string>(type: "nvarchar(2000)", maxLength: 2000, nullable: true),
                    InfoAccuracyConfirmed = table.Column<bool>(type: "bit", nullable: false),
                    TermsAccepted = table.Column<bool>(type: "bit", nullable: false),
                    IsPublic = table.Column<bool>(type: "bit", nullable: false),
                    CreatedByUserId = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: true),
                    CreatedDateTime = table.Column<DateTime>(type: "datetime2", nullable: true),
                    ModifiedByUserId = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: true),
                    ModifiedDateTime = table.Column<DateTime>(type: "datetime2", nullable: true),
                    IsDelete = table.Column<bool>(type: "bit", nullable: false),
                    BusinessId = table.Column<Guid>(type: "uniqueidentifier", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Advertisements", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Advertisements_Teachers_TeacherId",
                        column: x => x.TeacherId,
                        principalSchema: "Teacher",
                        principalTable: "Teachers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_Advertisements_IsPublic",
                schema: "Teacher",
                table: "Advertisements",
                column: "IsPublic");

            migrationBuilder.CreateIndex(
                name: "IX_Advertisements_TeacherId",
                schema: "Teacher",
                table: "Advertisements",
                column: "TeacherId",
                unique: true);
        }

        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "Advertisements",
                schema: "Teacher");
        }
    }
}
