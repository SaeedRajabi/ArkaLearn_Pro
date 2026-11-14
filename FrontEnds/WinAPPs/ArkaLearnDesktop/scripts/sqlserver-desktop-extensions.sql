-- =============================================================================
-- ArkaSoftware Desktop — SQL Server Production Script
-- Migrations:
--   20261008120000_AddDesktopDrmAndMessengerExtensions
--   20261008140000_AddMediaContentKeys
--
-- Safe to re-run: uses IF NOT EXISTS / COL_LENGTH checks
-- Run against your ArkaSoftware command database (SQL Server)
-- =============================================================================

SET NOCOUNT ON;
BEGIN TRANSACTION;

-- ---------------------------------------------------------------------------
-- Schema: Desktop
-- ---------------------------------------------------------------------------
IF NOT EXISTS (SELECT 1 FROM sys.schemas WHERE name = N'Desktop')
    EXEC(N'CREATE SCHEMA [Desktop]');

-- ---------------------------------------------------------------------------
-- Media.MediaAssets — DRM columns (Phase 3)
-- ---------------------------------------------------------------------------
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

-- ---------------------------------------------------------------------------
-- Desktop.MediaContentKeys (Phase 3)
-- ---------------------------------------------------------------------------
IF OBJECT_ID(N'[Desktop].[MediaContentKeys]', N'U') IS NULL
BEGIN
    CREATE TABLE [Desktop].[MediaContentKeys] (
        [Id]                   bigint         NOT NULL IDENTITY(1,1),
        [KeyId]                nvarchar(64)   NOT NULL,
        [MediaAssetId]         bigint         NOT NULL,
        [ProtectedKeyMaterial] nvarchar(512)  NOT NULL,
        [CreatedAtUtc]         datetime2      NOT NULL,
        [IsDeleted]            bit            NOT NULL CONSTRAINT [DF_MediaContentKeys_IsDeleted] DEFAULT 0,
        CONSTRAINT [PK_MediaContentKeys] PRIMARY KEY ([Id])
    );
END;

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'IX_MediaContentKeys_KeyId' AND object_id = OBJECT_ID(N'[Desktop].[MediaContentKeys]'))
    CREATE UNIQUE INDEX [IX_MediaContentKeys_KeyId] ON [Desktop].[MediaContentKeys] ([KeyId]);

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'IX_MediaContentKeys_MediaAssetId' AND object_id = OBJECT_ID(N'[Desktop].[MediaContentKeys]'))
    CREATE INDEX [IX_MediaContentKeys_MediaAssetId] ON [Desktop].[MediaContentKeys] ([MediaAssetId]);

-- ---------------------------------------------------------------------------
-- Support.SupportConversations / SupportMessages — desktop messenger cols
-- ---------------------------------------------------------------------------
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

-- ---------------------------------------------------------------------------
-- Support.SupportTeacherStories / StoryViews / DesktopUserPresences (Phase 4)
-- ---------------------------------------------------------------------------
IF OBJECT_ID(N'[Support].[SupportTeacherStories]', N'U') IS NULL
BEGIN
    CREATE TABLE [Support].[SupportTeacherStories] (
        [Id]                bigint               NOT NULL IDENTITY(1,1),
        [TeacherUserId]     bigint               NOT NULL,
        [Caption]           nvarchar(1000)       NOT NULL,
        [MediaUrl]          nvarchar(500)        NULL,
        [ThumbnailUrl]      nvarchar(500)        NULL,
        [CreatedAtUtc]      datetime2            NOT NULL,
        [ExpiresAtUtc]      datetime2            NOT NULL,
        [CreatedByUserId]   nvarchar(50)         NULL,
        [CreatedDateTime]   datetime2            NULL,
        [ModifiedByUserId]  nvarchar(50)         NULL,
        [ModifiedDateTime]  datetime2            NULL,
        [IsDelete]          bit                  NOT NULL,
        [BusinessId]        uniqueidentifier     NOT NULL,
        CONSTRAINT [PK_SupportTeacherStories] PRIMARY KEY ([Id])
    );
END;

IF OBJECT_ID(N'[Support].[SupportTeacherStoryViews]', N'U') IS NULL
BEGIN
    CREATE TABLE [Support].[SupportTeacherStoryViews] (
        [Id]                bigint               NOT NULL IDENTITY(1,1),
        [StoryId]           bigint               NOT NULL,
        [ViewerUserId]      bigint               NOT NULL,
        [ViewedAtUtc]       datetime2            NOT NULL,
        [CreatedByUserId]   nvarchar(50)         NULL,
        [CreatedDateTime]   datetime2            NULL,
        [ModifiedByUserId]  nvarchar(50)         NULL,
        [ModifiedDateTime]  datetime2            NULL,
        [IsDelete]          bit                  NOT NULL,
        [BusinessId]        uniqueidentifier     NOT NULL,
        CONSTRAINT [PK_SupportTeacherStoryViews] PRIMARY KEY ([Id]),
        CONSTRAINT [FK_SupportTeacherStoryViews_SupportTeacherStories_StoryId]
            FOREIGN KEY ([StoryId]) REFERENCES [Support].[SupportTeacherStories]([Id]) ON DELETE CASCADE
    );
END;

IF OBJECT_ID(N'[Support].[DesktopUserPresences]', N'U') IS NULL
BEGIN
    CREATE TABLE [Support].[DesktopUserPresences] (
        [Id]                bigint               NOT NULL IDENTITY(1,1),
        [UserId]            bigint               NOT NULL,
        [ConnectionId]      nvarchar(128)        NULL,
        [Status]            nvarchar(32)         NOT NULL,
        [AppVersion]        nvarchar(32)         NULL,
        [DeviceId]          nvarchar(128)        NULL,
        [LastSeenAtUtc]     datetime2            NOT NULL,
        [ConnectedAtUtc]    datetime2            NULL,
        [CreatedByUserId]   nvarchar(50)         NULL,
        [CreatedDateTime]   datetime2            NULL,
        [ModifiedByUserId]  nvarchar(50)         NULL,
        [ModifiedDateTime]  datetime2            NULL,
        [IsDelete]          bit                  NOT NULL,
        [BusinessId]        uniqueidentifier     NOT NULL,
        CONSTRAINT [PK_DesktopUserPresences] PRIMARY KEY ([Id])
    );
END;

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'IX_SupportTeacherStories_TeacherUserId_ExpiresAtUtc' AND object_id = OBJECT_ID(N'[Support].[SupportTeacherStories]'))
    CREATE INDEX [IX_SupportTeacherStories_TeacherUserId_ExpiresAtUtc] ON [Support].[SupportTeacherStories] ([TeacherUserId], [ExpiresAtUtc]);

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'IX_SupportTeacherStoryViews_StoryId_ViewerUserId' AND object_id = OBJECT_ID(N'[Support].[SupportTeacherStoryViews]'))
    CREATE UNIQUE INDEX [IX_SupportTeacherStoryViews_StoryId_ViewerUserId] ON [Support].[SupportTeacherStoryViews] ([StoryId], [ViewerUserId]);

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'IX_DesktopUserPresences_UserId' AND object_id = OBJECT_ID(N'[Support].[DesktopUserPresences]'))
    CREATE UNIQUE INDEX [IX_DesktopUserPresences_UserId] ON [Support].[DesktopUserPresences] ([UserId]);

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'IX_DesktopUserPresences_Status' AND object_id = OBJECT_ID(N'[Support].[DesktopUserPresences]'))
    CREATE INDEX [IX_DesktopUserPresences_Status] ON [Support].[DesktopUserPresences] ([Status]);

-- ---------------------------------------------------------------------------
-- Desktop schema tables (license, grants, device, remote assist, releases)
-- ---------------------------------------------------------------------------
IF OBJECT_ID(N'[Desktop].[DesktopAppLicenses]', N'U') IS NULL
BEGIN
    CREATE TABLE [Desktop].[DesktopAppLicenses] (
        [Id]                    bigint           NOT NULL IDENTITY(1,1),
        [UserId]                bigint           NOT NULL,
        [Status]                int              NOT NULL,
        [ExpiresAtUtc]          datetime2        NULL,
        [DeviceFingerprint]     nvarchar(256)    NULL,
        [IssuedAtUtc]           datetime2        NOT NULL,
        [LastValidatedAtUtc]    datetime2        NULL,
        [RevokeReason]          nvarchar(1000)   NULL,
        [IssuedByAdminUserId]   bigint           NULL,
        [CreatedByUserId]       nvarchar(50)     NULL,
        [CreatedDateTime]       datetime2        NULL,
        [ModifiedByUserId]      nvarchar(50)     NULL,
        [ModifiedDateTime]      datetime2        NULL,
        [IsDelete]              bit              NOT NULL,
        [BusinessId]            uniqueidentifier NOT NULL,
        CONSTRAINT [PK_DesktopAppLicenses] PRIMARY KEY ([Id])
    );
END;

IF OBJECT_ID(N'[Desktop].[OfflinePlaybackGrants]', N'U') IS NULL
BEGIN
    CREATE TABLE [Desktop].[OfflinePlaybackGrants] (
        [Id]                bigint           NOT NULL IDENTITY(1,1),
        [LicenseId]         bigint           NOT NULL,
        [UserId]            bigint           NOT NULL,
        [CourseId]          bigint           NOT NULL,
        [EnrollmentId]      bigint           NULL,
        [TokenJti]          nvarchar(64)     NOT NULL,
        [TokenHash]         nvarchar(128)    NOT NULL,
        [IssuedAtUtc]       datetime2        NOT NULL,
        [ExpiresAtUtc]      datetime2        NOT NULL,
        [RevokedAtUtc]      datetime2        NULL,
        [DeviceId]          nvarchar(128)    NULL,
        [CreatedByUserId]   nvarchar(50)     NULL,
        [CreatedDateTime]   datetime2        NULL,
        [ModifiedByUserId]  nvarchar(50)     NULL,
        [ModifiedDateTime]  datetime2        NULL,
        [IsDelete]          bit              NOT NULL,
        [BusinessId]        uniqueidentifier NOT NULL,
        CONSTRAINT [PK_OfflinePlaybackGrants] PRIMARY KEY ([Id])
    );
END;

IF OBJECT_ID(N'[Desktop].[DesktopDeviceRegistrations]', N'U') IS NULL
BEGIN
    CREATE TABLE [Desktop].[DesktopDeviceRegistrations] (
        [Id]                    bigint           NOT NULL IDENTITY(1,1),
        [UserId]                bigint           NOT NULL,
        [DeviceId]              nvarchar(128)    NOT NULL,
        [MachineName]           nvarchar(200)    NULL,
        [OsVersion]             nvarchar(100)    NULL,
        [AppVersion]            nvarchar(32)     NULL,
        [RegisteredAtUtc]       datetime2        NOT NULL,
        [LastHeartbeatAtUtc]    datetime2        NOT NULL,
        [IsBlocked]             bit              NOT NULL,
        [CreatedByUserId]       nvarchar(50)     NULL,
        [CreatedDateTime]       datetime2        NULL,
        [ModifiedByUserId]      nvarchar(50)     NULL,
        [ModifiedDateTime]      datetime2        NULL,
        [IsDelete]              bit              NOT NULL,
        [BusinessId]            uniqueidentifier NOT NULL,
        CONSTRAINT [PK_DesktopDeviceRegistrations] PRIMARY KEY ([Id])
    );
END;

IF OBJECT_ID(N'[Desktop].[DesktopAccessBlocks]', N'U') IS NULL
BEGIN
    CREATE TABLE [Desktop].[DesktopAccessBlocks] (
        [Id]                    bigint           NOT NULL IDENTITY(1,1),
        [UserId]                bigint           NOT NULL,
        [Scope]                 int              NOT NULL,
        [Reason]                nvarchar(1000)   NULL,
        [BlockedAtUtc]          datetime2        NOT NULL,
        [UnblockedAtUtc]        datetime2        NULL,
        [BlockedByAdminUserId]  bigint           NULL,
        [CreatedByUserId]       nvarchar(50)     NULL,
        [CreatedDateTime]       datetime2        NULL,
        [ModifiedByUserId]      nvarchar(50)     NULL,
        [ModifiedDateTime]      datetime2        NULL,
        [IsDelete]              bit              NOT NULL,
        [BusinessId]            uniqueidentifier NOT NULL,
        CONSTRAINT [PK_DesktopAccessBlocks] PRIMARY KEY ([Id])
    );
END;

IF OBJECT_ID(N'[Desktop].[RemoteAssistSessions]', N'U') IS NULL
BEGIN
    CREATE TABLE [Desktop].[RemoteAssistSessions] (
        [Id]                        bigint           NOT NULL IDENTITY(1,1),
        [RequesterUserId]           bigint           NOT NULL,
        [AcceptedByTeacherUserId]   bigint           NULL,
        [OneTimeSessionCode]        nvarchar(32)     NOT NULL,
        [PasswordHash]              nvarchar(256)    NOT NULL,
        [Status]                    int              NOT NULL,
        [CreatedAtUtc]              datetime2        NOT NULL,
        [CodeExpiresAtUtc]          datetime2        NOT NULL,
        [AcceptedAtUtc]             datetime2        NULL,
        [EndedAtUtc]                datetime2        NULL,
        [CreatedByUserId]           nvarchar(50)     NULL,
        [CreatedDateTime]           datetime2        NULL,
        [ModifiedByUserId]          nvarchar(50)     NULL,
        [ModifiedDateTime]          datetime2        NULL,
        [IsDelete]                  bit              NOT NULL,
        [BusinessId]                uniqueidentifier NOT NULL,
        CONSTRAINT [PK_RemoteAssistSessions] PRIMARY KEY ([Id])
    );
END;

IF OBJECT_ID(N'[Desktop].[DesktopAppReleases]', N'U') IS NULL
BEGIN
    CREATE TABLE [Desktop].[DesktopAppReleases] (
        [Id]                        bigint           NOT NULL IDENTITY(1,1),
        [Version]                   nvarchar(32)     NOT NULL,
        [InstallerUrl]              nvarchar(500)    NOT NULL,
        [ReleaseNotes]              nvarchar(4000)   NULL,
        [IsMandatory]               bit              NOT NULL,
        [MinSupportedVersion]       nvarchar(32)     NULL,
        [PublishedAtUtc]            datetime2        NOT NULL,
        [IsPublished]               bit              NOT NULL,
        [PublishedByAdminUserId]    bigint           NULL,
        [CreatedByUserId]           nvarchar(50)     NULL,
        [CreatedDateTime]           datetime2        NULL,
        [ModifiedByUserId]          nvarchar(50)     NULL,
        [ModifiedDateTime]          datetime2        NULL,
        [IsDelete]                  bit              NOT NULL,
        [BusinessId]                uniqueidentifier NOT NULL,
        CONSTRAINT [PK_DesktopAppReleases] PRIMARY KEY ([Id])
    );
END;

-- Indexes — Desktop tables
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'IX_DesktopAppLicenses_UserId' AND object_id = OBJECT_ID(N'[Desktop].[DesktopAppLicenses]'))
    CREATE INDEX [IX_DesktopAppLicenses_UserId] ON [Desktop].[DesktopAppLicenses] ([UserId]);

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'IX_DesktopAppLicenses_UserId_Status' AND object_id = OBJECT_ID(N'[Desktop].[DesktopAppLicenses]'))
    CREATE INDEX [IX_DesktopAppLicenses_UserId_Status] ON [Desktop].[DesktopAppLicenses] ([UserId], [Status]);

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'IX_OfflinePlaybackGrants_TokenJti' AND object_id = OBJECT_ID(N'[Desktop].[OfflinePlaybackGrants]'))
    CREATE UNIQUE INDEX [IX_OfflinePlaybackGrants_TokenJti] ON [Desktop].[OfflinePlaybackGrants] ([TokenJti]);

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'IX_OfflinePlaybackGrants_UserId_CourseId_ExpiresAtUtc' AND object_id = OBJECT_ID(N'[Desktop].[OfflinePlaybackGrants]'))
    CREATE INDEX [IX_OfflinePlaybackGrants_UserId_CourseId_ExpiresAtUtc] ON [Desktop].[OfflinePlaybackGrants] ([UserId], [CourseId], [ExpiresAtUtc]);

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'IX_DesktopDeviceRegistrations_UserId_DeviceId' AND object_id = OBJECT_ID(N'[Desktop].[DesktopDeviceRegistrations]'))
    CREATE UNIQUE INDEX [IX_DesktopDeviceRegistrations_UserId_DeviceId] ON [Desktop].[DesktopDeviceRegistrations] ([UserId], [DeviceId]);

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'IX_DesktopAccessBlocks_UserId_UnblockedAtUtc' AND object_id = OBJECT_ID(N'[Desktop].[DesktopAccessBlocks]'))
    CREATE INDEX [IX_DesktopAccessBlocks_UserId_UnblockedAtUtc] ON [Desktop].[DesktopAccessBlocks] ([UserId], [UnblockedAtUtc]);

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'IX_RemoteAssistSessions_OneTimeSessionCode' AND object_id = OBJECT_ID(N'[Desktop].[RemoteAssistSessions]'))
    CREATE INDEX [IX_RemoteAssistSessions_OneTimeSessionCode] ON [Desktop].[RemoteAssistSessions] ([OneTimeSessionCode]);

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'IX_RemoteAssistSessions_RequesterUserId_Status' AND object_id = OBJECT_ID(N'[Desktop].[RemoteAssistSessions]'))
    CREATE INDEX [IX_RemoteAssistSessions_RequesterUserId_Status] ON [Desktop].[RemoteAssistSessions] ([RequesterUserId], [Status]);

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'IX_DesktopAppReleases_Version' AND object_id = OBJECT_ID(N'[Desktop].[DesktopAppReleases]'))
    CREATE UNIQUE INDEX [IX_DesktopAppReleases_Version] ON [Desktop].[DesktopAppReleases] ([Version]);

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'IX_DesktopAppReleases_IsPublished_PublishedAtUtc' AND object_id = OBJECT_ID(N'[Desktop].[DesktopAppReleases]'))
    CREATE INDEX [IX_DesktopAppReleases_IsPublished_PublishedAtUtc] ON [Desktop].[DesktopAppReleases] ([IsPublished], [PublishedAtUtc]);

COMMIT TRANSACTION;

PRINT N'ArkaSoftware Desktop SQL Server extensions applied successfully.';
