using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;
using ArkaSoftwarePro.Src.Infrastructure.Data.MSSQL.Commands.Common;

#nullable disable

namespace ArkaSoftwarePro.Src.Infrastructure.Data.MSSQL.Commands.Migrations
{
    [DbContext(typeof(ArkaSoftwareCommandDbContext))]
    [Migration("20260903120000_AddExamRichAnswers")]
    public partial class AddExamRichAnswers : Migration
    {
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql("""
                IF OBJECT_ID(N'Exam.Exams', N'U') IS NOT NULL
                AND NOT EXISTS (
                    SELECT 1 FROM sys.columns
                    WHERE object_id = OBJECT_ID(N'Exam.Exams') AND name = N'AllowPaste'
                )
                BEGIN
                    ALTER TABLE Exam.Exams ADD AllowPaste BIT NOT NULL CONSTRAINT DF_Exams_AllowPaste DEFAULT(0);
                END
                """);

            migrationBuilder.Sql("""
                IF OBJECT_ID(N'Exam.ExamAnswers', N'U') IS NOT NULL
                AND NOT EXISTS (
                    SELECT 1 FROM sys.columns
                    WHERE object_id = OBJECT_ID(N'Exam.ExamAnswers') AND name = N'PasteCount'
                )
                BEGIN
                    ALTER TABLE Exam.ExamAnswers ADD PasteCount INT NOT NULL CONSTRAINT DF_ExamAnswers_PasteCount DEFAULT(0);
                END
                """);

            migrationBuilder.Sql("""
                IF OBJECT_ID(N'Exam.ExamAnswers', N'U') IS NOT NULL
                AND EXISTS (
                    SELECT 1 FROM sys.columns
                    WHERE object_id = OBJECT_ID(N'Exam.ExamAnswers') AND name = N'TextAnswer' AND max_length <> -1
                )
                BEGIN
                    ALTER TABLE Exam.ExamAnswers ALTER COLUMN TextAnswer NVARCHAR(MAX) NULL;
                END
                """);
        }

        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql("""
                IF OBJECT_ID(N'Exam.ExamAnswers', N'U') IS NOT NULL
                AND EXISTS (
                    SELECT 1 FROM sys.columns
                    WHERE object_id = OBJECT_ID(N'Exam.ExamAnswers') AND name = N'PasteCount'
                )
                BEGIN
                    ALTER TABLE Exam.ExamAnswers DROP CONSTRAINT DF_ExamAnswers_PasteCount;
                    ALTER TABLE Exam.ExamAnswers DROP COLUMN PasteCount;
                END
                """);

            migrationBuilder.Sql("""
                IF OBJECT_ID(N'Exam.Exams', N'U') IS NOT NULL
                AND EXISTS (
                    SELECT 1 FROM sys.columns
                    WHERE object_id = OBJECT_ID(N'Exam.Exams') AND name = N'AllowPaste'
                )
                BEGIN
                    ALTER TABLE Exam.Exams DROP CONSTRAINT DF_Exams_AllowPaste;
                    ALTER TABLE Exam.Exams DROP COLUMN AllowPaste;
                END
                """);
        }
    }
}
