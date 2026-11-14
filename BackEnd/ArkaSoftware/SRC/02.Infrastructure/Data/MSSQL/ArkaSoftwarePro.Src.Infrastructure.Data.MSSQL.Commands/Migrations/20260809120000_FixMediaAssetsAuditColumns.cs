using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;
using ArkaSoftwarePro.Src.Infrastructure.Data.MSSQL.Commands.Common;

#nullable disable

namespace ArkaSoftwarePro.Src.Infrastructure.Data.MSSQL.Commands.Migrations;

/// <summary>
/// Aligns Media.MediaAssets with framework audit columns and adds moderation fields.
/// Supports legacy IsDeleted / CreatedAtUtc column names.
/// </summary>
[DbContext(typeof(ArkaSoftwareCommandDbContext))]
[Migration("20260809120000_FixMediaAssetsAuditColumns")]
public partial class FixMediaAssetsAuditColumns : Migration
{
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.Sql("""
            IF OBJECT_ID(N'[Media].[MediaAssets]', N'U') IS NULL
                RETURN;

            IF COL_LENGTH('Media.MediaAssets', 'BusinessId') IS NULL
                ALTER TABLE [Media].[MediaAssets] ADD [BusinessId] uniqueidentifier NOT NULL DEFAULT NEWID();

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
                    ALTER TABLE [Media].[MediaAssets] ADD [IsDeleted] bit NOT NULL CONSTRAINT [DF_MediaAssets_IsDeleted] DEFAULT(0);
            END

            IF COL_LENGTH('Media.MediaAssets', 'ApprovalStatus') IS NULL
                ALTER TABLE [Media].[MediaAssets] ADD [ApprovalStatus] int NOT NULL CONSTRAINT [DF_MediaAssets_ApprovalStatus] DEFAULT(1);

            IF COL_LENGTH('Media.MediaAssets', 'RejectionReason') IS NULL
                ALTER TABLE [Media].[MediaAssets] ADD [RejectionReason] nvarchar(1000) NULL;

            IF COL_LENGTH('Media.MediaAssets', 'IsRejectionDismissed') IS NULL
                ALTER TABLE [Media].[MediaAssets] ADD [IsRejectionDismissed] bit NOT NULL CONSTRAINT [DF_MediaAssets_IsRejectionDismissed] DEFAULT(0);

            IF EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_MediaAssets_IsDeleted_CreatedAtUtc' AND object_id = OBJECT_ID('[Media].[MediaAssets]'))
                DROP INDEX [IX_MediaAssets_IsDeleted_CreatedAtUtc] ON [Media].[MediaAssets];

            IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_MediaAssets_IsDeleted_ApprovalStatus' AND object_id = OBJECT_ID('[Media].[MediaAssets]'))
               AND COL_LENGTH('Media.MediaAssets', 'IsDeleted') IS NOT NULL
               AND COL_LENGTH('Media.MediaAssets', 'ApprovalStatus') IS NOT NULL
                CREATE INDEX [IX_MediaAssets_IsDeleted_ApprovalStatus] ON [Media].[MediaAssets] ([IsDeleted], [ApprovalStatus]);
            """);
    }

    protected override void Down(MigrationBuilder migrationBuilder)
    {
        // Intentionally empty — reverting would re-break EF mappings.
    }
}
