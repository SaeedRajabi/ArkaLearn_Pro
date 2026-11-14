using Microsoft.EntityFrameworkCore.Migrations;
using Microsoft.EntityFrameworkCore.Infrastructure;

#nullable disable

using ArkaSoftwarePro.Src.Infrastructure.Data.MSSQL.Commands.Common;

namespace ArkaSoftwarePro.Src.Infrastructure.Data.MSSQL.Commands.Migrations;

[DbContext(typeof(ArkaSoftwareCommandDbContext))]
[Migration("20260801140000_AddSeoFieldsAndMediaAssets")]
public partial class AddSeoFieldsAndMediaAssets : Migration
{
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.EnsureSchema(name: "Media");

        migrationBuilder.Sql("""
            IF OBJECT_ID(N'[Media].[MediaAssets]', N'U') IS NULL
            BEGIN
                CREATE TABLE [Media].[MediaAssets] (
                    [Id] bigint NOT NULL IDENTITY(1, 1),
                    [OwnerUserId] bigint NOT NULL,
                    [FileUrl] nvarchar(500) NOT NULL,
                    [OriginalFileName] nvarchar(260) NOT NULL,
                    [MimeType] nvarchar(100) NOT NULL,
                    [FileSizeBytes] bigint NOT NULL,
                    [MediaType] int NOT NULL,
                    [Title] nvarchar(200) NULL,
                    [AltText] nvarchar(500) NULL,
                    [Caption] nvarchar(1000) NULL,
                    [Description] nvarchar(2000) NULL,
                    [Width] int NULL,
                    [Height] int NULL,
                    [ApprovalStatus] int NOT NULL CONSTRAINT [DF_MediaAssets_ApprovalStatus] DEFAULT 1,
                    [RejectionReason] nvarchar(1000) NULL,
                    [IsRejectionDismissed] bit NOT NULL CONSTRAINT [DF_MediaAssets_IsRejectionDismissed] DEFAULT 0,
                    [CreatedByUserId] nvarchar(50) NULL,
                    [CreatedDateTime] datetime2 NULL,
                    [ModifiedByUserId] nvarchar(50) NULL,
                    [ModifiedDateTime] datetime2 NULL,
                    [IsDeleted] bit NOT NULL,
                    [BusinessId] uniqueidentifier NOT NULL,
                    CONSTRAINT [PK_MediaAssets] PRIMARY KEY ([Id]),
                    CONSTRAINT [AK_MediaAssets_BusinessId] UNIQUE ([BusinessId])
                );
            END

            IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'IX_MediaAssets_OwnerUserId' AND object_id = OBJECT_ID(N'[Media].[MediaAssets]'))
                CREATE INDEX [IX_MediaAssets_OwnerUserId] ON [Media].[MediaAssets] ([OwnerUserId]);

            IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'IX_MediaAssets_IsDeleted_ApprovalStatus' AND object_id = OBJECT_ID(N'[Media].[MediaAssets]'))
                CREATE INDEX [IX_MediaAssets_IsDeleted_ApprovalStatus] ON [Media].[MediaAssets] ([IsDeleted], [ApprovalStatus]);
            """);

        AddSeoColumns(migrationBuilder, "Article", "Articles");
        AddSeoColumns(migrationBuilder, "Course", "Courses");
        AddSeoColumns(migrationBuilder, "Seminar", "Seminars");
        AddSeoColumns(migrationBuilder, "Project", "Projects");
        AddSeoColumns(migrationBuilder, "Teacher", "Books");
        AddSeoColumns(migrationBuilder, "Teacher", "Advertisements");
        AddSeoColumns(migrationBuilder, "Teacher", "PromotionalVideos");
    }

    private static void AddSeoColumns(MigrationBuilder migrationBuilder, string schema, string table)
    {
        migrationBuilder.Sql($"""
            IF OBJECT_ID(N'[{schema}].[{table}]', N'U') IS NOT NULL
            BEGIN
                IF COL_LENGTH('{schema}.{table}', 'SeoTitle') IS NULL
                    ALTER TABLE [{schema}].[{table}] ADD [SeoTitle] nvarchar(200) NULL;
                IF COL_LENGTH('{schema}.{table}', 'MetaDescription') IS NULL
                    ALTER TABLE [{schema}].[{table}] ADD [MetaDescription] nvarchar(320) NULL;
                IF COL_LENGTH('{schema}.{table}', 'OgImageUrl') IS NULL
                    ALTER TABLE [{schema}].[{table}] ADD [OgImageUrl] nvarchar(500) NULL;
            END
            """);
    }

    protected override void Down(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.DropTable(name: "MediaAssets", schema: "Media");

        DropSeoColumns(migrationBuilder, "Article", "Articles");
        DropSeoColumns(migrationBuilder, "Course", "Courses");
        DropSeoColumns(migrationBuilder, "Seminar", "Seminars");
        DropSeoColumns(migrationBuilder, "Project", "Projects");
        DropSeoColumns(migrationBuilder, "Teacher", "Books");
        DropSeoColumns(migrationBuilder, "Teacher", "Advertisements");
        DropSeoColumns(migrationBuilder, "Teacher", "PromotionalVideos");
    }

    private static void DropSeoColumns(MigrationBuilder migrationBuilder, string schema, string table)
    {
        migrationBuilder.DropColumn(name: "SeoTitle", schema: schema, table: table);
        migrationBuilder.DropColumn(name: "MetaDescription", schema: schema, table: table);
        migrationBuilder.DropColumn(name: "OgImageUrl", schema: schema, table: table);
    }
}
