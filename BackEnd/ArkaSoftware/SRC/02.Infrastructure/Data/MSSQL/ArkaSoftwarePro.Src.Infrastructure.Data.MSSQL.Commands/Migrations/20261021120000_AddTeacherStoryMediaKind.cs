using Microsoft.EntityFrameworkCore.Migrations;
using Microsoft.EntityFrameworkCore.Infrastructure;
using ArkaSoftwarePro.Src.Infrastructure.Data.MSSQL.Commands.Common;

#nullable disable

namespace ArkaSoftwarePro.Src.Infrastructure.Data.MSSQL.Commands.Migrations;

[DbContext(typeof(ArkaSoftwareCommandDbContext))]
[Migration("20261021120000_AddTeacherStoryMediaKind")]
public partial class AddTeacherStoryMediaKind : Migration
{
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.AddColumn<int>(
            name: "MediaKind",
            schema: "Support",
            table: "SupportTeacherStories",
            type: "int",
            nullable: false,
            defaultValue: 0);

        migrationBuilder.AddColumn<int>(
            name: "DurationSeconds",
            schema: "Support",
            table: "SupportTeacherStories",
            type: "int",
            nullable: false,
            defaultValue: 5);

        migrationBuilder.Sql("""
            UPDATE [Support].[SupportTeacherStories]
            SET [MediaKind] = CASE
                    WHEN [MediaUrl] IS NOT NULL AND (
                        LOWER([MediaUrl]) LIKE '%.mp4'
                        OR LOWER([MediaUrl]) LIKE '%.webm'
                        OR LOWER([MediaUrl]) LIKE '%.mov'
                        OR LOWER([MediaUrl]) LIKE '%.m4v'
                    ) THEN 2
                    WHEN [MediaUrl] IS NOT NULL AND LTRIM(RTRIM([MediaUrl])) <> N'' THEN 1
                    ELSE 0
                END,
                [DurationSeconds] = CASE
                    WHEN [MediaUrl] IS NOT NULL AND (
                        LOWER([MediaUrl]) LIKE '%.mp4'
                        OR LOWER([MediaUrl]) LIKE '%.webm'
                        OR LOWER([MediaUrl]) LIKE '%.mov'
                        OR LOWER([MediaUrl]) LIKE '%.m4v'
                    ) THEN 60
                    ELSE 5
                END
            """);
    }

    protected override void Down(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.DropColumn(name: "MediaKind", schema: "Support", table: "SupportTeacherStories");
        migrationBuilder.DropColumn(name: "DurationSeconds", schema: "Support", table: "SupportTeacherStories");
    }
}
