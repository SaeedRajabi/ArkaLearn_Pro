using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

using ArkaSoftwarePro.Src.Infrastructure.Data.MSSQL.Commands.Common;

namespace ArkaSoftwarePro.Src.Infrastructure.Data.MSSQL.Commands.Migrations;

/// <summary>
/// Phase 1: DRM fields on MediaAsset, SupportChat desktop messenger extensions,
/// and Desktop schema for license / offline grant / device / remote assist / releases.
/// </summary>
[DbContext(typeof(ArkaSoftwareCommandDbContext))]
[Migration("20261008120000_AddDesktopDrmAndMessengerExtensions")]
public partial class AddDesktopDrmAndMessengerExtensions : Migration
{
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.EnsureSchema(name: "Desktop");

        // ---- MediaAsset DRM columns ----
        migrationBuilder.Sql("""
            IF COL_LENGTH(N'[Media].[MediaAssets]', N'IsEncrypted') IS NULL
                ALTER TABLE [Media].[MediaAssets] ADD [IsEncrypted] bit NOT NULL CONSTRAINT [DF_MediaAssets_IsEncrypted] DEFAULT 0;
            IF COL_LENGTH(N'[Media].[MediaAssets]', N'EncryptedFileUrl') IS NULL
                ALTER TABLE [Media].[MediaAssets] ADD [EncryptedFileUrl] nvarchar(500) NULL;
            IF COL_LENGTH(N'[Media].[MediaAssets]', N'EncryptionAlgorithm') IS NULL
                ALTER TABLE [Media].[MediaAssets] ADD [EncryptionAlgorithm] nvarchar(64) NOT NULL CONSTRAINT [DF_MediaAssets_EncryptionAlgorithm] DEFAULT N'AES-256-CBC';
            IF COL_LENGTH(N'[Media].[MediaAssets]', N'ContentKeyId') IS NULL
                ALTER TABLE [Media].[MediaAssets] ADD [ContentKeyId] nvarchar(128) NULL;
            IF COL_LENGTH(N'[Media].[MediaAssets]', N'EncryptionIvBase64') IS NULL
                ALTER TABLE [Media].[MediaAssets] ADD [EncryptionIvBase64] nvarchar(128) NULL;
            IF COL_LENGTH(N'[Media].[MediaAssets]', N'ContentChecksumSha256') IS NULL
                ALTER TABLE [Media].[MediaAssets] ADD [ContentChecksumSha256] nvarchar(128) NULL;
            IF COL_LENGTH(N'[Media].[MediaAssets]', N'EncryptionStatus') IS NULL
                ALTER TABLE [Media].[MediaAssets] ADD [EncryptionStatus] int NOT NULL CONSTRAINT [DF_MediaAssets_EncryptionStatus] DEFAULT 0;
            IF COL_LENGTH(N'[Media].[MediaAssets]', N'EncryptedAtUtc') IS NULL
                ALTER TABLE [Media].[MediaAssets] ADD [EncryptedAtUtc] datetime2 NULL;

            IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'IX_MediaAssets_ContentKeyId' AND object_id = OBJECT_ID(N'[Media].[MediaAssets]'))
                CREATE INDEX [IX_MediaAssets_ContentKeyId] ON [Media].[MediaAssets] ([ContentKeyId]);
            IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'IX_MediaAssets_IsEncrypted' AND object_id = OBJECT_ID(N'[Media].[MediaAssets]'))
                CREATE INDEX [IX_MediaAssets_IsEncrypted] ON [Media].[MediaAssets] ([IsEncrypted]);
            """);

        // ---- SupportConversation / SupportMessage desktop columns ----
        migrationBuilder.Sql("""
            IF COL_LENGTH(N'[Support].[SupportConversations]', N'IsDesktopEnabled') IS NULL
                ALTER TABLE [Support].[SupportConversations] ADD [IsDesktopEnabled] bit NOT NULL CONSTRAINT [DF_SupportConversations_IsDesktopEnabled] DEFAULT 1;

            IF COL_LENGTH(N'[Support].[SupportMessages]', N'SeenAtUtc') IS NULL
                ALTER TABLE [Support].[SupportMessages] ADD [SeenAtUtc] datetime2 NULL;
            IF COL_LENGTH(N'[Support].[SupportMessages]', N'ClientMessageId') IS NULL
                ALTER TABLE [Support].[SupportMessages] ADD [ClientMessageId] nvarchar(64) NULL;
            IF COL_LENGTH(N'[Support].[SupportMessages]', N'AttachmentUrl') IS NULL
                ALTER TABLE [Support].[SupportMessages] ADD [AttachmentUrl] nvarchar(500) NULL;
            IF COL_LENGTH(N'[Support].[SupportMessages]', N'AttachmentFileName') IS NULL
                ALTER TABLE [Support].[SupportMessages] ADD [AttachmentFileName] nvarchar(260) NULL;
            IF COL_LENGTH(N'[Support].[SupportMessages]', N'AttachmentSizeBytes') IS NULL
                ALTER TABLE [Support].[SupportMessages] ADD [AttachmentSizeBytes] bigint NULL;
            IF COL_LENGTH(N'[Support].[SupportMessages]', N'AttachmentContentType') IS NULL
                ALTER TABLE [Support].[SupportMessages] ADD [AttachmentContentType] nvarchar(100) NULL;
            IF COL_LENGTH(N'[Support].[SupportMessages]', N'AttachmentUploadSessionId') IS NULL
                ALTER TABLE [Support].[SupportMessages] ADD [AttachmentUploadSessionId] nvarchar(64) NULL;

            IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'IX_SupportMessages_ClientMessageId' AND object_id = OBJECT_ID(N'[Support].[SupportMessages]'))
                CREATE INDEX [IX_SupportMessages_ClientMessageId] ON [Support].[SupportMessages] ([ClientMessageId]);
            """);

        migrationBuilder.CreateTable(
            name: "SupportTeacherStories",
            schema: "Support",
            columns: table => new
            {
                Id = table.Column<long>(type: "bigint", nullable: false)
                    .Annotation("SqlServer:Identity", "1, 1"),
                TeacherUserId = table.Column<long>(type: "bigint", nullable: false),
                Caption = table.Column<string>(type: "nvarchar(1000)", maxLength: 1000, nullable: false),
                MediaUrl = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: true),
                ThumbnailUrl = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: true),
                CreatedAtUtc = table.Column<DateTime>(type: "datetime2", nullable: false),
                ExpiresAtUtc = table.Column<DateTime>(type: "datetime2", nullable: false),
                CreatedByUserId = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: true),
                CreatedDateTime = table.Column<DateTime>(type: "datetime2", nullable: true),
                ModifiedByUserId = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: true),
                ModifiedDateTime = table.Column<DateTime>(type: "datetime2", nullable: true),
                IsDelete = table.Column<bool>(type: "bit", nullable: false),
                BusinessId = table.Column<Guid>(type: "uniqueidentifier", nullable: false)
            },
            constraints: table =>
            {
                table.PrimaryKey("PK_SupportTeacherStories", x => x.Id);
            });

        migrationBuilder.CreateTable(
            name: "SupportTeacherStoryViews",
            schema: "Support",
            columns: table => new
            {
                Id = table.Column<long>(type: "bigint", nullable: false)
                    .Annotation("SqlServer:Identity", "1, 1"),
                StoryId = table.Column<long>(type: "bigint", nullable: false),
                ViewerUserId = table.Column<long>(type: "bigint", nullable: false),
                ViewedAtUtc = table.Column<DateTime>(type: "datetime2", nullable: false),
                CreatedByUserId = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: true),
                CreatedDateTime = table.Column<DateTime>(type: "datetime2", nullable: true),
                ModifiedByUserId = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: true),
                ModifiedDateTime = table.Column<DateTime>(type: "datetime2", nullable: true),
                IsDelete = table.Column<bool>(type: "bit", nullable: false),
                BusinessId = table.Column<Guid>(type: "uniqueidentifier", nullable: false)
            },
            constraints: table =>
            {
                table.PrimaryKey("PK_SupportTeacherStoryViews", x => x.Id);
                table.ForeignKey(
                    name: "FK_SupportTeacherStoryViews_SupportTeacherStories_StoryId",
                    column: x => x.StoryId,
                    principalSchema: "Support",
                    principalTable: "SupportTeacherStories",
                    principalColumn: "Id",
                    onDelete: ReferentialAction.Cascade);
            });

        migrationBuilder.CreateTable(
            name: "DesktopUserPresences",
            schema: "Support",
            columns: table => new
            {
                Id = table.Column<long>(type: "bigint", nullable: false)
                    .Annotation("SqlServer:Identity", "1, 1"),
                UserId = table.Column<long>(type: "bigint", nullable: false),
                ConnectionId = table.Column<string>(type: "nvarchar(128)", maxLength: 128, nullable: true),
                Status = table.Column<string>(type: "nvarchar(32)", maxLength: 32, nullable: false),
                AppVersion = table.Column<string>(type: "nvarchar(32)", maxLength: 32, nullable: true),
                DeviceId = table.Column<string>(type: "nvarchar(128)", maxLength: 128, nullable: true),
                LastSeenAtUtc = table.Column<DateTime>(type: "datetime2", nullable: false),
                ConnectedAtUtc = table.Column<DateTime>(type: "datetime2", nullable: true),
                CreatedByUserId = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: true),
                CreatedDateTime = table.Column<DateTime>(type: "datetime2", nullable: true),
                ModifiedByUserId = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: true),
                ModifiedDateTime = table.Column<DateTime>(type: "datetime2", nullable: true),
                IsDelete = table.Column<bool>(type: "bit", nullable: false),
                BusinessId = table.Column<Guid>(type: "uniqueidentifier", nullable: false)
            },
            constraints: table =>
            {
                table.PrimaryKey("PK_DesktopUserPresences", x => x.Id);
            });

        migrationBuilder.CreateTable(
            name: "DesktopAppLicenses",
            schema: "Desktop",
            columns: table => new
            {
                Id = table.Column<long>(type: "bigint", nullable: false)
                    .Annotation("SqlServer:Identity", "1, 1"),
                UserId = table.Column<long>(type: "bigint", nullable: false),
                Status = table.Column<int>(type: "int", nullable: false),
                ExpiresAtUtc = table.Column<DateTime>(type: "datetime2", nullable: true),
                DeviceFingerprint = table.Column<string>(type: "nvarchar(256)", maxLength: 256, nullable: true),
                IssuedAtUtc = table.Column<DateTime>(type: "datetime2", nullable: false),
                LastValidatedAtUtc = table.Column<DateTime>(type: "datetime2", nullable: true),
                RevokeReason = table.Column<string>(type: "nvarchar(1000)", maxLength: 1000, nullable: true),
                IssuedByAdminUserId = table.Column<long>(type: "bigint", nullable: true),
                CreatedByUserId = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: true),
                CreatedDateTime = table.Column<DateTime>(type: "datetime2", nullable: true),
                ModifiedByUserId = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: true),
                ModifiedDateTime = table.Column<DateTime>(type: "datetime2", nullable: true),
                IsDelete = table.Column<bool>(type: "bit", nullable: false),
                BusinessId = table.Column<Guid>(type: "uniqueidentifier", nullable: false)
            },
            constraints: table =>
            {
                table.PrimaryKey("PK_DesktopAppLicenses", x => x.Id);
            });

        migrationBuilder.CreateTable(
            name: "OfflinePlaybackGrants",
            schema: "Desktop",
            columns: table => new
            {
                Id = table.Column<long>(type: "bigint", nullable: false)
                    .Annotation("SqlServer:Identity", "1, 1"),
                LicenseId = table.Column<long>(type: "bigint", nullable: false),
                UserId = table.Column<long>(type: "bigint", nullable: false),
                CourseId = table.Column<long>(type: "bigint", nullable: false),
                EnrollmentId = table.Column<long>(type: "bigint", nullable: true),
                TokenJti = table.Column<string>(type: "nvarchar(64)", maxLength: 64, nullable: false),
                TokenHash = table.Column<string>(type: "nvarchar(128)", maxLength: 128, nullable: false),
                IssuedAtUtc = table.Column<DateTime>(type: "datetime2", nullable: false),
                ExpiresAtUtc = table.Column<DateTime>(type: "datetime2", nullable: false),
                RevokedAtUtc = table.Column<DateTime>(type: "datetime2", nullable: true),
                DeviceId = table.Column<string>(type: "nvarchar(128)", maxLength: 128, nullable: true),
                CreatedByUserId = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: true),
                CreatedDateTime = table.Column<DateTime>(type: "datetime2", nullable: true),
                ModifiedByUserId = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: true),
                ModifiedDateTime = table.Column<DateTime>(type: "datetime2", nullable: true),
                IsDelete = table.Column<bool>(type: "bit", nullable: false),
                BusinessId = table.Column<Guid>(type: "uniqueidentifier", nullable: false)
            },
            constraints: table =>
            {
                table.PrimaryKey("PK_OfflinePlaybackGrants", x => x.Id);
            });

        migrationBuilder.CreateTable(
            name: "DesktopDeviceRegistrations",
            schema: "Desktop",
            columns: table => new
            {
                Id = table.Column<long>(type: "bigint", nullable: false)
                    .Annotation("SqlServer:Identity", "1, 1"),
                UserId = table.Column<long>(type: "bigint", nullable: false),
                DeviceId = table.Column<string>(type: "nvarchar(128)", maxLength: 128, nullable: false),
                MachineName = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: true),
                OsVersion = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: true),
                AppVersion = table.Column<string>(type: "nvarchar(32)", maxLength: 32, nullable: true),
                RegisteredAtUtc = table.Column<DateTime>(type: "datetime2", nullable: false),
                LastHeartbeatAtUtc = table.Column<DateTime>(type: "datetime2", nullable: false),
                IsBlocked = table.Column<bool>(type: "bit", nullable: false),
                CreatedByUserId = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: true),
                CreatedDateTime = table.Column<DateTime>(type: "datetime2", nullable: true),
                ModifiedByUserId = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: true),
                ModifiedDateTime = table.Column<DateTime>(type: "datetime2", nullable: true),
                IsDelete = table.Column<bool>(type: "bit", nullable: false),
                BusinessId = table.Column<Guid>(type: "uniqueidentifier", nullable: false)
            },
            constraints: table =>
            {
                table.PrimaryKey("PK_DesktopDeviceRegistrations", x => x.Id);
            });

        migrationBuilder.CreateTable(
            name: "DesktopAccessBlocks",
            schema: "Desktop",
            columns: table => new
            {
                Id = table.Column<long>(type: "bigint", nullable: false)
                    .Annotation("SqlServer:Identity", "1, 1"),
                UserId = table.Column<long>(type: "bigint", nullable: false),
                Scope = table.Column<int>(type: "int", nullable: false),
                Reason = table.Column<string>(type: "nvarchar(1000)", maxLength: 1000, nullable: true),
                BlockedAtUtc = table.Column<DateTime>(type: "datetime2", nullable: false),
                UnblockedAtUtc = table.Column<DateTime>(type: "datetime2", nullable: true),
                BlockedByAdminUserId = table.Column<long>(type: "bigint", nullable: true),
                CreatedByUserId = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: true),
                CreatedDateTime = table.Column<DateTime>(type: "datetime2", nullable: true),
                ModifiedByUserId = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: true),
                ModifiedDateTime = table.Column<DateTime>(type: "datetime2", nullable: true),
                IsDelete = table.Column<bool>(type: "bit", nullable: false),
                BusinessId = table.Column<Guid>(type: "uniqueidentifier", nullable: false)
            },
            constraints: table =>
            {
                table.PrimaryKey("PK_DesktopAccessBlocks", x => x.Id);
            });

        migrationBuilder.CreateTable(
            name: "RemoteAssistSessions",
            schema: "Desktop",
            columns: table => new
            {
                Id = table.Column<long>(type: "bigint", nullable: false)
                    .Annotation("SqlServer:Identity", "1, 1"),
                RequesterUserId = table.Column<long>(type: "bigint", nullable: false),
                AcceptedByTeacherUserId = table.Column<long>(type: "bigint", nullable: true),
                OneTimeSessionCode = table.Column<string>(type: "nvarchar(32)", maxLength: 32, nullable: false),
                PasswordHash = table.Column<string>(type: "nvarchar(256)", maxLength: 256, nullable: false),
                Status = table.Column<int>(type: "int", nullable: false),
                CreatedAtUtc = table.Column<DateTime>(type: "datetime2", nullable: false),
                CodeExpiresAtUtc = table.Column<DateTime>(type: "datetime2", nullable: false),
                AcceptedAtUtc = table.Column<DateTime>(type: "datetime2", nullable: true),
                EndedAtUtc = table.Column<DateTime>(type: "datetime2", nullable: true),
                CreatedByUserId = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: true),
                CreatedDateTime = table.Column<DateTime>(type: "datetime2", nullable: true),
                ModifiedByUserId = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: true),
                ModifiedDateTime = table.Column<DateTime>(type: "datetime2", nullable: true),
                IsDelete = table.Column<bool>(type: "bit", nullable: false),
                BusinessId = table.Column<Guid>(type: "uniqueidentifier", nullable: false)
            },
            constraints: table =>
            {
                table.PrimaryKey("PK_RemoteAssistSessions", x => x.Id);
            });

        migrationBuilder.CreateTable(
            name: "DesktopAppReleases",
            schema: "Desktop",
            columns: table => new
            {
                Id = table.Column<long>(type: "bigint", nullable: false)
                    .Annotation("SqlServer:Identity", "1, 1"),
                Version = table.Column<string>(type: "nvarchar(32)", maxLength: 32, nullable: false),
                InstallerUrl = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: false),
                ReleaseNotes = table.Column<string>(type: "nvarchar(4000)", maxLength: 4000, nullable: true),
                IsMandatory = table.Column<bool>(type: "bit", nullable: false),
                MinSupportedVersion = table.Column<string>(type: "nvarchar(32)", maxLength: 32, nullable: true),
                PublishedAtUtc = table.Column<DateTime>(type: "datetime2", nullable: false),
                IsPublished = table.Column<bool>(type: "bit", nullable: false),
                PublishedByAdminUserId = table.Column<long>(type: "bigint", nullable: true),
                CreatedByUserId = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: true),
                CreatedDateTime = table.Column<DateTime>(type: "datetime2", nullable: true),
                ModifiedByUserId = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: true),
                ModifiedDateTime = table.Column<DateTime>(type: "datetime2", nullable: true),
                IsDelete = table.Column<bool>(type: "bit", nullable: false),
                BusinessId = table.Column<Guid>(type: "uniqueidentifier", nullable: false)
            },
            constraints: table =>
            {
                table.PrimaryKey("PK_DesktopAppReleases", x => x.Id);
            });

        migrationBuilder.CreateIndex(
            name: "IX_SupportTeacherStories_TeacherUserId_ExpiresAtUtc",
            schema: "Support",
            table: "SupportTeacherStories",
            columns: new[] { "TeacherUserId", "ExpiresAtUtc" });

        migrationBuilder.CreateIndex(
            name: "IX_SupportTeacherStoryViews_StoryId_ViewerUserId",
            schema: "Support",
            table: "SupportTeacherStoryViews",
            columns: new[] { "StoryId", "ViewerUserId" },
            unique: true);

        migrationBuilder.CreateIndex(
            name: "IX_DesktopUserPresences_UserId",
            schema: "Support",
            table: "DesktopUserPresences",
            column: "UserId",
            unique: true);

        migrationBuilder.CreateIndex(
            name: "IX_DesktopUserPresences_Status",
            schema: "Support",
            table: "DesktopUserPresences",
            column: "Status");

        migrationBuilder.CreateIndex(
            name: "IX_DesktopAppLicenses_UserId",
            schema: "Desktop",
            table: "DesktopAppLicenses",
            column: "UserId");

        migrationBuilder.CreateIndex(
            name: "IX_DesktopAppLicenses_UserId_Status",
            schema: "Desktop",
            table: "DesktopAppLicenses",
            columns: new[] { "UserId", "Status" });

        migrationBuilder.CreateIndex(
            name: "IX_OfflinePlaybackGrants_TokenJti",
            schema: "Desktop",
            table: "OfflinePlaybackGrants",
            column: "TokenJti",
            unique: true);

        migrationBuilder.CreateIndex(
            name: "IX_OfflinePlaybackGrants_UserId_CourseId_ExpiresAtUtc",
            schema: "Desktop",
            table: "OfflinePlaybackGrants",
            columns: new[] { "UserId", "CourseId", "ExpiresAtUtc" });

        migrationBuilder.CreateIndex(
            name: "IX_DesktopDeviceRegistrations_UserId_DeviceId",
            schema: "Desktop",
            table: "DesktopDeviceRegistrations",
            columns: new[] { "UserId", "DeviceId" },
            unique: true);

        migrationBuilder.CreateIndex(
            name: "IX_DesktopAccessBlocks_UserId_UnblockedAtUtc",
            schema: "Desktop",
            table: "DesktopAccessBlocks",
            columns: new[] { "UserId", "UnblockedAtUtc" });

        migrationBuilder.CreateIndex(
            name: "IX_RemoteAssistSessions_OneTimeSessionCode",
            schema: "Desktop",
            table: "RemoteAssistSessions",
            column: "OneTimeSessionCode");

        migrationBuilder.CreateIndex(
            name: "IX_RemoteAssistSessions_RequesterUserId_Status",
            schema: "Desktop",
            table: "RemoteAssistSessions",
            columns: new[] { "RequesterUserId", "Status" });

        migrationBuilder.CreateIndex(
            name: "IX_DesktopAppReleases_Version",
            schema: "Desktop",
            table: "DesktopAppReleases",
            column: "Version",
            unique: true);

        migrationBuilder.CreateIndex(
            name: "IX_DesktopAppReleases_IsPublished_PublishedAtUtc",
            schema: "Desktop",
            table: "DesktopAppReleases",
            columns: new[] { "IsPublished", "PublishedAtUtc" });
    }

    protected override void Down(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.DropTable(name: "SupportTeacherStoryViews", schema: "Support");
        migrationBuilder.DropTable(name: "SupportTeacherStories", schema: "Support");
        migrationBuilder.DropTable(name: "DesktopUserPresences", schema: "Support");
        migrationBuilder.DropTable(name: "DesktopAppLicenses", schema: "Desktop");
        migrationBuilder.DropTable(name: "OfflinePlaybackGrants", schema: "Desktop");
        migrationBuilder.DropTable(name: "DesktopDeviceRegistrations", schema: "Desktop");
        migrationBuilder.DropTable(name: "DesktopAccessBlocks", schema: "Desktop");
        migrationBuilder.DropTable(name: "RemoteAssistSessions", schema: "Desktop");
        migrationBuilder.DropTable(name: "DesktopAppReleases", schema: "Desktop");

        migrationBuilder.Sql("""
            IF EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'IX_MediaAssets_ContentKeyId' AND object_id = OBJECT_ID(N'[Media].[MediaAssets]'))
                DROP INDEX [IX_MediaAssets_ContentKeyId] ON [Media].[MediaAssets];
            IF EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'IX_MediaAssets_IsEncrypted' AND object_id = OBJECT_ID(N'[Media].[MediaAssets]'))
                DROP INDEX [IX_MediaAssets_IsEncrypted] ON [Media].[MediaAssets];
            IF EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'IX_SupportMessages_ClientMessageId' AND object_id = OBJECT_ID(N'[Support].[SupportMessages]'))
                DROP INDEX [IX_SupportMessages_ClientMessageId] ON [Support].[SupportMessages];

            IF COL_LENGTH(N'[Media].[MediaAssets]', N'EncryptedAtUtc') IS NOT NULL
                ALTER TABLE [Media].[MediaAssets] DROP COLUMN [EncryptedAtUtc];
            IF COL_LENGTH(N'[Media].[MediaAssets]', N'EncryptionStatus') IS NOT NULL
                ALTER TABLE [Media].[MediaAssets] DROP COLUMN [EncryptionStatus];
            IF COL_LENGTH(N'[Media].[MediaAssets]', N'ContentChecksumSha256') IS NOT NULL
                ALTER TABLE [Media].[MediaAssets] DROP COLUMN [ContentChecksumSha256];
            IF COL_LENGTH(N'[Media].[MediaAssets]', N'EncryptionIvBase64') IS NOT NULL
                ALTER TABLE [Media].[MediaAssets] DROP COLUMN [EncryptionIvBase64];
            IF COL_LENGTH(N'[Media].[MediaAssets]', N'ContentKeyId') IS NOT NULL
                ALTER TABLE [Media].[MediaAssets] DROP COLUMN [ContentKeyId];
            IF COL_LENGTH(N'[Media].[MediaAssets]', N'EncryptionAlgorithm') IS NOT NULL
                ALTER TABLE [Media].[MediaAssets] DROP COLUMN [EncryptionAlgorithm];
            IF COL_LENGTH(N'[Media].[MediaAssets]', N'EncryptedFileUrl') IS NOT NULL
                ALTER TABLE [Media].[MediaAssets] DROP COLUMN [EncryptedFileUrl];
            IF COL_LENGTH(N'[Media].[MediaAssets]', N'IsEncrypted') IS NOT NULL
                ALTER TABLE [Media].[MediaAssets] DROP COLUMN [IsEncrypted];

            IF COL_LENGTH(N'[Support].[SupportConversations]', N'IsDesktopEnabled') IS NOT NULL
                ALTER TABLE [Support].[SupportConversations] DROP COLUMN [IsDesktopEnabled];
            IF COL_LENGTH(N'[Support].[SupportMessages]', N'AttachmentUploadSessionId') IS NOT NULL
                ALTER TABLE [Support].[SupportMessages] DROP COLUMN [AttachmentUploadSessionId];
            IF COL_LENGTH(N'[Support].[SupportMessages]', N'AttachmentContentType') IS NOT NULL
                ALTER TABLE [Support].[SupportMessages] DROP COLUMN [AttachmentContentType];
            IF COL_LENGTH(N'[Support].[SupportMessages]', N'AttachmentSizeBytes') IS NOT NULL
                ALTER TABLE [Support].[SupportMessages] DROP COLUMN [AttachmentSizeBytes];
            IF COL_LENGTH(N'[Support].[SupportMessages]', N'AttachmentFileName') IS NOT NULL
                ALTER TABLE [Support].[SupportMessages] DROP COLUMN [AttachmentFileName];
            IF COL_LENGTH(N'[Support].[SupportMessages]', N'AttachmentUrl') IS NOT NULL
                ALTER TABLE [Support].[SupportMessages] DROP COLUMN [AttachmentUrl];
            IF COL_LENGTH(N'[Support].[SupportMessages]', N'ClientMessageId') IS NOT NULL
                ALTER TABLE [Support].[SupportMessages] DROP COLUMN [ClientMessageId];
            IF COL_LENGTH(N'[Support].[SupportMessages]', N'SeenAtUtc') IS NOT NULL
                ALTER TABLE [Support].[SupportMessages] DROP COLUMN [SeenAtUtc];
            """);
    }
}
