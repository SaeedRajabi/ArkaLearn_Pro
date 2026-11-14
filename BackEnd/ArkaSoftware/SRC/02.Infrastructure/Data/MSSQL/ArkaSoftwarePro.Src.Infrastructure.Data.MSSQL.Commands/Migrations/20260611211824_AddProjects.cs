using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ArkaSoftwarePro.Src.Infrastructure.Data.MSSQL.Commands.Migrations
{
    /// <inheritdoc />
    public partial class AddProjects : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {

            migrationBuilder.EnsureSchema(
                name: "Project");

            migrationBuilder.AddColumn<long>(
                name: "ProjectId",
                schema: "Tag",
                table: "Tags",
                type: "bigint",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "EndDateUtc",
                schema: "Education",
                table: "EducationPlans",
                type: "datetime2",
                nullable: false,
                defaultValue: new DateTime(1, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified));

            migrationBuilder.AddColumn<long>(
                name: "ManagedRoomStudentId",
                schema: "Education",
                table: "EducationPlans",
                type: "bigint",
                nullable: false,
                defaultValue: 0L);

            migrationBuilder.AddColumn<long>(
                name: "OwnerUserId",
                schema: "Education",
                table: "EducationPlans",
                type: "bigint",
                nullable: false,
                defaultValue: 0L);

            migrationBuilder.AddColumn<long>(
                name: "RoomId",
                schema: "Education",
                table: "EducationPlans",
                type: "bigint",
                nullable: false,
                defaultValue: 0L);

            migrationBuilder.AddColumn<DateTime>(
                name: "StartDateUtc",
                schema: "Education",
                table: "EducationPlans",
                type: "datetime2",
                nullable: false,
                defaultValue: new DateTime(1, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified));

            migrationBuilder.AddColumn<int>(
                name: "UsedMinutes",
                schema: "Education",
                table: "EducationPlans",
                type: "int",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.CreateTable(
                name: "EducationPlanSessionUsages",
                schema: "Education",
                columns: table => new
                {
                    Id = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    EducationPlanId = table.Column<long>(type: "bigint", nullable: false),
                    RoomSessionId = table.Column<long>(type: "bigint", nullable: false),
                    MinutesConsumed = table.Column<int>(type: "int", nullable: false),
                    ConsumedAtUtc = table.Column<DateTime>(type: "datetime2", nullable: false),
                    CreatedByUserId = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: true),
                    CreatedDateTime = table.Column<DateTime>(type: "datetime2", nullable: true),
                    ModifiedByUserId = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: true),
                    ModifiedDateTime = table.Column<DateTime>(type: "datetime2", nullable: true),
                    IsDelete = table.Column<bool>(type: "bit", nullable: false),
                    BusinessId = table.Column<Guid>(type: "uniqueidentifier", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_EducationPlanSessionUsages", x => x.Id);
                    table.ForeignKey(
                        name: "FK_EducationPlanSessionUsages_EducationPlans_EducationPlanId",
                        column: x => x.EducationPlanId,
                        principalSchema: "Education",
                        principalTable: "EducationPlans",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "NotificationSettings",
                schema: "Website",
                columns: table => new
                {
                    Id = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    IsEnabled = table.Column<bool>(type: "bit", nullable: false),
                    ApiKey = table.Column<string>(type: "NVARCHAR(500)", maxLength: 500, nullable: false),
                    LineNumber = table.Column<long>(type: "bigint", nullable: false),
                    RegistrationOtpEnabled = table.Column<bool>(type: "bit", nullable: false),
                    RegistrationVerifyTemplateId = table.Column<int>(type: "int", nullable: false),
                    PhoneChangeOtpEnabled = table.Column<bool>(type: "bit", nullable: false),
                    PhoneChangeVerifyTemplateId = table.Column<int>(type: "int", nullable: false),
                    EducationPlanSmsEnabled = table.Column<bool>(type: "bit", nullable: false),
                    EducationPlanVerifyTemplateId = table.Column<int>(type: "int", nullable: false),
                    EducationPlanMessageTemplate = table.Column<string>(type: "NVARCHAR(MAX)", nullable: false),
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
                    table.PrimaryKey("PK_NotificationSettings", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "Projects",
                schema: "Project",
                columns: table => new
                {
                    Id = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    Title = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: false),
                    Slug = table.Column<string>(type: "nvarchar(250)", maxLength: 250, nullable: false),
                    ShortDescription = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: true),
                    LongDescription = table.Column<string>(type: "nvarchar(max)", maxLength: 2147483647, nullable: true),
                    ThumbnailUrl = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: true),
                    IntroVideoUrl = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: true),
                    GitHubUrl = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: true),
                    ProjectUrl = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: true),
                    TechnologiesJson = table.Column<string>(type: "nvarchar(4000)", maxLength: 4000, nullable: true),
                    GalleryJson = table.Column<string>(type: "nvarchar(max)", maxLength: 2147483647, nullable: true),
                    IsPublished = table.Column<bool>(type: "bit", nullable: false),
                    PublishedAt = table.Column<DateTime>(type: "datetime2", nullable: true),
                    AuthorUserId = table.Column<long>(type: "bigint", nullable: false),
                    CreatedByUserId = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: true),
                    CreatedDateTime = table.Column<DateTime>(type: "datetime2", nullable: true),
                    ModifiedByUserId = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: true),
                    ModifiedDateTime = table.Column<DateTime>(type: "datetime2", nullable: true),
                    IsDelete = table.Column<bool>(type: "bit", nullable: false),
                    BusinessId = table.Column<Guid>(type: "uniqueidentifier", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Projects", x => x.Id);
                });

            migrationBuilder.CreateIndex(
                name: "IX_Tags_ProjectId",
                schema: "Tag",
                table: "Tags",
                column: "ProjectId");

            migrationBuilder.CreateIndex(
                name: "IX_EducationPlans_ManagedRoomStudentId",
                schema: "Education",
                table: "EducationPlans",
                column: "ManagedRoomStudentId");

            migrationBuilder.CreateIndex(
                name: "IX_EducationPlans_RoomId",
                schema: "Education",
                table: "EducationPlans",
                column: "RoomId");

            migrationBuilder.CreateIndex(
                name: "IX_EducationPlanSessionUsages_EducationPlanId_RoomSessionId",
                schema: "Education",
                table: "EducationPlanSessionUsages",
                columns: new[] { "EducationPlanId", "RoomSessionId" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_Projects_AuthorUserId",
                schema: "Project",
                table: "Projects",
                column: "AuthorUserId");

            migrationBuilder.CreateIndex(
                name: "IX_Projects_Slug",
                schema: "Project",
                table: "Projects",
                column: "Slug",
                unique: true);

            migrationBuilder.AddForeignKey(
                name: "FK_Tags_Projects_ProjectId",
                schema: "Tag",
                table: "Tags",
                column: "ProjectId",
                principalSchema: "Project",
                principalTable: "Projects",
                principalColumn: "Id",
                onDelete: ReferentialAction.SetNull);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Tags_Projects_ProjectId",
                schema: "Tag",
                table: "Tags");

            migrationBuilder.DropTable(
                name: "EducationPlanSessionUsages",
                schema: "Education");

            migrationBuilder.DropTable(
                name: "NotificationSettings",
                schema: "Website");

            migrationBuilder.DropTable(
                name: "Projects",
                schema: "Project");

            migrationBuilder.DropIndex(
                name: "IX_Tags_ProjectId",
                schema: "Tag",
                table: "Tags");

            migrationBuilder.DropIndex(
                name: "IX_EducationPlans_ManagedRoomStudentId",
                schema: "Education",
                table: "EducationPlans");

            migrationBuilder.DropIndex(
                name: "IX_EducationPlans_RoomId",
                schema: "Education",
                table: "EducationPlans");

            migrationBuilder.DropColumn(
                name: "ProjectId",
                schema: "Tag",
                table: "Tags");

            migrationBuilder.DropColumn(
                name: "EndDateUtc",
                schema: "Education",
                table: "EducationPlans");

            migrationBuilder.DropColumn(
                name: "ManagedRoomStudentId",
                schema: "Education",
                table: "EducationPlans");

            migrationBuilder.DropColumn(
                name: "OwnerUserId",
                schema: "Education",
                table: "EducationPlans");

            migrationBuilder.DropColumn(
                name: "RoomId",
                schema: "Education",
                table: "EducationPlans");

            migrationBuilder.DropColumn(
                name: "StartDateUtc",
                schema: "Education",
                table: "EducationPlans");

            migrationBuilder.DropColumn(
                name: "UsedMinutes",
                schema: "Education",
                table: "EducationPlans");

            migrationBuilder.CreateIndex(
                name: "IX_EducationPlans_Title",
                schema: "Education",
                table: "EducationPlans",
                column: "Title",
                unique: true,
                filter: "[Title] IS NOT NULL");
        }
    }
}
