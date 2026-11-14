-- Migration: 20260815120000_AddSoftwareProducts
-- Creates Software.Products and Software.Likes tables
-- Safe to run multiple times.

BEGIN TRANSACTION;
GO

IF SCHEMA_ID(N'Software') IS NULL
    EXEC(N'CREATE SCHEMA [Software]');
GO

IF OBJECT_ID(N'[Software].[Products]', N'U') IS NULL
BEGIN
    CREATE TABLE [Software].[Products] (
        [Id] bigint NOT NULL IDENTITY(1, 1),
        [TeacherId] bigint NULL,
        [AuthorUserId] bigint NOT NULL,
        [Title] nvarchar(300) NOT NULL,
        [Description] nvarchar(1000) NOT NULL,
        [LongDescriptionHtml] NVARCHAR(MAX) NOT NULL,
        [CoverImageUrl] nvarchar(2000) NULL,
        [InstallerFileUrl] nvarchar(2000) NULL,
        [InstallerFileName] nvarchar(260) NULL,
        [CategoryId] bigint NULL,
        [Slug] nvarchar(220) NOT NULL,
        [TagsJson] nvarchar(2000) NOT NULL CONSTRAINT [DF_Products_TagsJson] DEFAULT N'[]',
        [DownloadCount] int NOT NULL CONSTRAINT [DF_Products_DownloadCount] DEFAULT 0,
        [LikeCount] int NOT NULL CONSTRAINT [DF_Products_LikeCount] DEFAULT 0,
        [ApprovalStatus] tinyint NOT NULL,
        [ApprovedSnapshotJson] NVARCHAR(MAX) NULL,
        [SortOrder] int NOT NULL CONSTRAINT [DF_Products_SortOrder] DEFAULT 0,
        [SeoTitle] nvarchar(200) NULL,
        [MetaDescription] nvarchar(320) NULL,
        [OgImageUrl] nvarchar(500) NULL,
        [CreatedByUserId] nvarchar(50) NULL,
        [CreatedDateTime] datetime2 NULL,
        [ModifiedByUserId] nvarchar(50) NULL,
        [ModifiedDateTime] datetime2 NULL,
        [IsDelete] bit NOT NULL,
        [BusinessId] uniqueidentifier NOT NULL,
        CONSTRAINT [PK_Products] PRIMARY KEY ([Id]),
        CONSTRAINT [AK_Products_BusinessId] UNIQUE ([BusinessId]),
        CONSTRAINT [FK_Products_Categories_CategoryId]
            FOREIGN KEY ([CategoryId]) REFERENCES [Category].[Categories] ([Id]) ON DELETE SET NULL,
        CONSTRAINT [FK_Products_Teachers_TeacherId]
            FOREIGN KEY ([TeacherId]) REFERENCES [Teacher].[Teachers] ([Id]) ON DELETE CASCADE
    );

    CREATE UNIQUE INDEX [IX_Products_Slug] ON [Software].[Products] ([Slug]);
    CREATE INDEX [IX_Products_TeacherId] ON [Software].[Products] ([TeacherId]);
    CREATE INDEX [IX_Products_CategoryId] ON [Software].[Products] ([CategoryId]);
END
GO

IF OBJECT_ID(N'[Software].[Likes]', N'U') IS NULL
BEGIN
    CREATE TABLE [Software].[Likes] (
        [Id] bigint NOT NULL IDENTITY(1, 1),
        [SoftwareProductId] bigint NOT NULL,
        [UserId] bigint NOT NULL,
        [CreatedByUserId] nvarchar(50) NULL,
        [CreatedDateTime] datetime2 NULL,
        [ModifiedByUserId] nvarchar(50) NULL,
        [ModifiedDateTime] datetime2 NULL,
        [IsDelete] bit NOT NULL,
        [BusinessId] uniqueidentifier NOT NULL,
        CONSTRAINT [PK_Likes] PRIMARY KEY ([Id]),
        CONSTRAINT [FK_Likes_Products_SoftwareProductId]
            FOREIGN KEY ([SoftwareProductId]) REFERENCES [Software].[Products] ([Id]) ON DELETE CASCADE
    );

    CREATE UNIQUE INDEX [IX_Likes_SoftwareProductId_UserId]
        ON [Software].[Likes] ([SoftwareProductId], [UserId]);
END
GO

IF NOT EXISTS (
    SELECT 1 FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260815120000_AddSoftwareProducts'
)
BEGIN
    INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
    VALUES (N'20260815120000_AddSoftwareProducts', N'9.0.3');
END
GO

COMMIT TRANSACTION;
GO
