using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;
using ArkaSoftwarePro.Src.Infrastructure.Data.MSSQL.Commands.Common;

#nullable disable

namespace ArkaSoftwarePro.Src.Infrastructure.Data.MSSQL.Commands.Migrations
{
    [DbContext(typeof(ArkaSoftwareCommandDbContext))]
    [Migration("20260620120000_AddExamQuestionCodeFields")]
    public partial class AddExamQuestionCodeFields : Migration
    {
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql("""
                IF OBJECT_ID(N'Exam.ExamQuestions', N'U') IS NOT NULL
                AND NOT EXISTS (
                    SELECT 1 FROM sys.columns
                    WHERE object_id = OBJECT_ID(N'Exam.ExamQuestions') AND name = N'CodeSnippet'
                )
                BEGIN
                    ALTER TABLE Exam.ExamQuestions ADD CodeSnippet NVARCHAR(MAX) NULL;
                END
                """);

            migrationBuilder.Sql("""
                IF OBJECT_ID(N'Exam.ExamQuestions', N'U') IS NOT NULL
                AND NOT EXISTS (
                    SELECT 1 FROM sys.columns
                    WHERE object_id = OBJECT_ID(N'Exam.ExamQuestions') AND name = N'CodeLanguage'
                )
                BEGIN
                    ALTER TABLE Exam.ExamQuestions ADD CodeLanguage NVARCHAR(50) NULL;
                END
                """);
        }

        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql("""
                IF OBJECT_ID(N'Exam.ExamQuestions', N'U') IS NOT NULL
                AND EXISTS (
                    SELECT 1 FROM sys.columns
                    WHERE object_id = OBJECT_ID(N'Exam.ExamQuestions') AND name = N'CodeLanguage'
                )
                BEGIN
                    ALTER TABLE Exam.ExamQuestions DROP COLUMN CodeLanguage;
                END
                """);

            migrationBuilder.Sql("""
                IF OBJECT_ID(N'Exam.ExamQuestions', N'U') IS NOT NULL
                AND EXISTS (
                    SELECT 1 FROM sys.columns
                    WHERE object_id = OBJECT_ID(N'Exam.ExamQuestions') AND name = N'CodeSnippet'
                )
                BEGIN
                    ALTER TABLE Exam.ExamQuestions DROP COLUMN CodeSnippet;
                END
                """);
        }
    }
}
