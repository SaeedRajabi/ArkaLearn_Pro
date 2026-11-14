using Microsoft.EntityFrameworkCore.Migrations;
using Microsoft.EntityFrameworkCore.Infrastructure;

#nullable disable

using ArkaSoftwarePro.Src.Infrastructure.Data.MSSQL.Commands.Common;

namespace ArkaSoftwarePro.Src.Infrastructure.Data.MSSQL.Commands.Migrations;

[DbContext(typeof(ArkaSoftwareCommandDbContext))]
[Migration("20260621123000_IncreaseTeacherBookIsbnLength")]
public partial class IncreaseTeacherBookIsbnLength : Migration
{
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.Sql("""
            IF COL_LENGTH('Teacher.Books', 'Isbn') IS NOT NULL
            BEGIN
                DECLARE @var sysname;
                SELECT @var = [d].[name]
                FROM [sys].[default_constraints] [d]
                INNER JOIN [sys].[columns] [c] ON [d].[parent_column_id] = [c].[column_id] AND [d].[parent_object_id] = [c].[object_id]
                WHERE ([d].[parent_object_id] = OBJECT_ID(N'[Teacher].[Books]') AND [c].[name] = N'Isbn');
                IF @var IS NOT NULL EXEC(N'ALTER TABLE [Teacher].[Books] DROP CONSTRAINT [' + @var + '];');
                ALTER TABLE [Teacher].[Books] ALTER COLUMN [Isbn] nvarchar(50) NULL;
            END
            """);
    }

    protected override void Down(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.AlterColumn<string>(
            name: "Isbn",
            schema: "Teacher",
            table: "Books",
            type: "nvarchar(20)",
            maxLength: 20,
            nullable: true,
            oldClrType: typeof(string),
            oldType: "nvarchar(50)",
            oldMaxLength: 50,
            oldNullable: true);
    }
}
