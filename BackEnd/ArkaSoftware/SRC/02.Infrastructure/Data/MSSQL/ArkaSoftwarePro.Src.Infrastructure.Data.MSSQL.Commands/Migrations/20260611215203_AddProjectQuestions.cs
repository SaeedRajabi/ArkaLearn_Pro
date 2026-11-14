using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ArkaSoftwarePro.Src.Infrastructure.Data.MSSQL.Commands.Migrations
{
    /// <inheritdoc />
    public partial class AddProjectQuestions : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "ProjectAnswerLikes",
                schema: "Project",
                columns: table => new
                {
                    Id = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    AnswerId = table.Column<long>(type: "bigint", nullable: false),
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
                    table.PrimaryKey("PK_ProjectAnswerLikes", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "ProjectQuestions",
                schema: "Project",
                columns: table => new
                {
                    Id = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    ProjectId = table.Column<long>(type: "bigint", nullable: false),
                    UserId = table.Column<long>(type: "bigint", nullable: false),
                    Subject = table.Column<string>(type: "nvarchar(300)", maxLength: 300, nullable: true),
                    ContentHtml = table.Column<string>(type: "NVARCHAR(MAX)", nullable: false),
                    AudioUrl = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: true),
                    Status = table.Column<byte>(type: "tinyint", nullable: false),
                    ReviewedByUserId = table.Column<long>(type: "bigint", nullable: true),
                    ReviewedAt = table.Column<DateTime>(type: "datetime2", nullable: true),
                    CreatedByUserId = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: true),
                    CreatedDateTime = table.Column<DateTime>(type: "datetime2", nullable: true),
                    ModifiedByUserId = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: true),
                    ModifiedDateTime = table.Column<DateTime>(type: "datetime2", nullable: true),
                    IsDelete = table.Column<bool>(type: "bit", nullable: false),
                    BusinessId = table.Column<Guid>(type: "uniqueidentifier", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ProjectQuestions", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "ProjectAnswers",
                schema: "Project",
                columns: table => new
                {
                    Id = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    QuestionId = table.Column<long>(type: "bigint", nullable: false),
                    UserId = table.Column<long>(type: "bigint", nullable: false),
                    ContentHtml = table.Column<string>(type: "NVARCHAR(MAX)", nullable: false),
                    AudioUrl = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: true),
                    LikeCount = table.Column<int>(type: "int", nullable: false),
                    CreatedByUserId = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: true),
                    CreatedDateTime = table.Column<DateTime>(type: "datetime2", nullable: true),
                    ModifiedByUserId = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: true),
                    ModifiedDateTime = table.Column<DateTime>(type: "datetime2", nullable: true),
                    IsDelete = table.Column<bool>(type: "bit", nullable: false),
                    BusinessId = table.Column<Guid>(type: "uniqueidentifier", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ProjectAnswers", x => x.Id);
                    table.ForeignKey(
                        name: "FK_ProjectAnswers_ProjectQuestions_QuestionId",
                        column: x => x.QuestionId,
                        principalSchema: "Project",
                        principalTable: "ProjectQuestions",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_ProjectAnswerLikes_AnswerId_UserId",
                schema: "Project",
                table: "ProjectAnswerLikes",
                columns: new[] { "AnswerId", "UserId" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_ProjectAnswers_QuestionId",
                schema: "Project",
                table: "ProjectAnswers",
                column: "QuestionId");

            migrationBuilder.CreateIndex(
                name: "IX_ProjectQuestions_ProjectId",
                schema: "Project",
                table: "ProjectQuestions",
                column: "ProjectId");

            migrationBuilder.CreateIndex(
                name: "IX_ProjectQuestions_Status",
                schema: "Project",
                table: "ProjectQuestions",
                column: "Status");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "ProjectAnswerLikes",
                schema: "Project");

            migrationBuilder.DropTable(
                name: "ProjectAnswers",
                schema: "Project");

            migrationBuilder.DropTable(
                name: "ProjectQuestions",
                schema: "Project");
        }
    }
}
