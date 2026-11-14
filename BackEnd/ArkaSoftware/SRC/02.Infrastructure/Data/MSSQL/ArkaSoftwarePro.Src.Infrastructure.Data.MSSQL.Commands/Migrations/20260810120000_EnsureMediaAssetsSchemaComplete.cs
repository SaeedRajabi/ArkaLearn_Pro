using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;
using ArkaSoftwarePro.Src.Infrastructure.Data.MSSQL.Commands.Common;

#nullable disable

namespace ArkaSoftwarePro.Src.Infrastructure.Data.MSSQL.Commands.Migrations;

/// <summary>
/// Ensures Media.MediaAssets matches the command-side EF model (framework audit + moderation columns).
/// Fixes legacy tables that only had CreatedAtUtc / IsDelete without BusinessId.
/// </summary>
[DbContext(typeof(ArkaSoftwareCommandDbContext))]
[Migration("20260810120000_EnsureMediaAssetsSchemaComplete")]
public partial class EnsureMediaAssetsSchemaComplete : Migration
{
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.Sql("""
            IF SCHEMA_ID(N'Media') IS NULL
                EXEC(N'CREATE SCHEMA [Media]');

            IF OBJECT_ID(N'[Media].[MediaAssets]', N'U') IS NULL
            BEGIN
                CREATE TABLE [Media].[MediaAssets] (
                    [Id] bigint NOT NULL IDENTITY,
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
                    [ApprovalStatus] int NOT NULL CONSTRAINT [DF_MediaAssets_ApprovalStatus_v2] DEFAULT(1),
                    [RejectionReason] nvarchar(1000) NULL,
                    [IsRejectionDismissed] bit NOT NULL CONSTRAINT [DF_MediaAssets_IsRejectionDismissed_v2] DEFAULT(0),
                    [CreatedByUserId] nvarchar(50) NULL,
                    [CreatedDateTime] datetime2 NULL,
                    [ModifiedByUserId] nvarchar(50) NULL,
                    [ModifiedDateTime] datetime2 NULL,
                    [IsDeleted] bit NOT NULL CONSTRAINT [DF_MediaAssets_IsDeleted_v2] DEFAULT(0),
                    [BusinessId] uniqueidentifier NOT NULL CONSTRAINT [DF_MediaAssets_BusinessId_v2] DEFAULT NEWID(),
                    CONSTRAINT [PK_MediaAssets] PRIMARY KEY ([Id]),
                    CONSTRAINT [AK_MediaAssets_BusinessId] UNIQUE ([BusinessId])
                );
                CREATE INDEX [IX_MediaAssets_OwnerUserId] ON [Media].[MediaAssets] ([OwnerUserId]);
                CREATE INDEX [IX_MediaAssets_IsDeleted_ApprovalStatus] ON [Media].[MediaAssets] ([IsDeleted], [ApprovalStatus]);
            END
            ELSE
            BEGIN
                IF COL_LENGTH('Media.MediaAssets', 'BusinessId') IS NULL
                    ALTER TABLE [Media].[MediaAssets] ADD [BusinessId] uniqueidentifier NOT NULL CONSTRAINT [DF_MediaAssets_BusinessId_fix] DEFAULT NEWID();

                IF COL_LENGTH('Media.MediaAssets', 'CreatedByUserId') IS NULL
                    ALTER TABLE [Media].[MediaAssets] ADD [CreatedByUserId] nvarchar(50) NULL;

                IF COL_LENGTH('Media.MediaAssets', 'ModifiedByUserId') IS NULL
                    ALTER TABLE [Media].[MediaAssets] ADD [ModifiedByUserId] nvarchar(50) NULL;

                IF COL_LENGTH('Media.MediaAssets', 'CreatedDateTime') IS NULL
                BEGIN
                    IF COL_LENGTH('Media.MediaAssets', 'CreatedAtUtc') IS NOT NULL
                        EXEC sp_rename 'Media.MediaAssets.CreatedAtUtc', 'CreatedDateTime', 'COLUMN';
                    ELSE
                        ALTER TABLE [Media].[MediaAssets] ADD [CreatedDateTime] datetime2 NULL;
                END

                IF COL_LENGTH('Media.MediaAssets', 'ModifiedDateTime') IS NULL
                BEGIN
                    IF COL_LENGTH('Media.MediaAssets', 'UpdatedAtUtc') IS NOT NULL
                        EXEC sp_rename 'Media.MediaAssets.UpdatedAtUtc', 'ModifiedDateTime', 'COLUMN';
                    ELSE
                        ALTER TABLE [Media].[MediaAssets] ADD [ModifiedDateTime] datetime2 NULL;
                END

                IF COL_LENGTH('Media.MediaAssets', 'IsDeleted') IS NULL
                BEGIN
                    IF COL_LENGTH('Media.MediaAssets', 'IsDelete') IS NOT NULL
                        EXEC sp_rename 'Media.MediaAssets.IsDelete', 'IsDeleted', 'COLUMN';
                    ELSE
                        ALTER TABLE [Media].[MediaAssets] ADD [IsDeleted] bit NOT NULL CONSTRAINT [DF_MediaAssets_IsDeleted_fix] DEFAULT(0);
                END

                IF COL_LENGTH('Media.MediaAssets', 'ApprovalStatus') IS NULL
                    ALTER TABLE [Media].[MediaAssets] ADD [ApprovalStatus] int NOT NULL CONSTRAINT [DF_MediaAssets_ApprovalStatus_fix] DEFAULT(1);

                IF COL_LENGTH('Media.MediaAssets', 'RejectionReason') IS NULL
                    ALTER TABLE [Media].[MediaAssets] ADD [RejectionReason] nvarchar(1000) NULL;

                IF COL_LENGTH('Media.MediaAssets', 'IsRejectionDismissed') IS NULL
                    ALTER TABLE [Media].[MediaAssets] ADD [IsRejectionDismissed] bit NOT NULL CONSTRAINT [DF_MediaAssets_IsRejectionDismissed_fix] DEFAULT(0);

                IF COL_LENGTH('Media.MediaAssets', 'CreatedAtUtc') IS NOT NULL
                    ALTER TABLE [Media].[MediaAssets] DROP COLUMN [CreatedAtUtc];

                IF COL_LENGTH('Media.MediaAssets', 'UpdatedAtUtc') IS NOT NULL
                    ALTER TABLE [Media].[MediaAssets] DROP COLUMN [UpdatedAtUtc];

                IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_MediaAssets_IsDeleted_ApprovalStatus' AND object_id = OBJECT_ID('[Media].[MediaAssets]'))
                   AND COL_LENGTH('Media.MediaAssets', 'IsDeleted') IS NOT NULL
                   AND COL_LENGTH('Media.MediaAssets', 'ApprovalStatus') IS NOT NULL
                    CREATE INDEX [IX_MediaAssets_IsDeleted_ApprovalStatus] ON [Media].[MediaAssets] ([IsDeleted], [ApprovalStatus]);
            END
            """);
    }

    protected override void Down(MigrationBuilder migrationBuilder)
    {
        // Intentionally empty — do not drop production media data.
    }
}
