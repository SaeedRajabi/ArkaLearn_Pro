-- Combined fix for admin login schema gaps (Aug 2026 migrations).
-- Run on the server database when login fails with "Invalid column name ...".
-- Safe to run multiple times.
--
-- Recommended order if running files separately:
--   1. AddUserWalletSystem.sql
--   2. AddTeacherBookFormatFiles.sql
--   3. AddTeacherBookCategoryId.sql   <-- current error (CategoryId)
--   4. AddSoftwareProducts.sql
--
-- Or run this single file only for the current CategoryId error:
--   AddTeacherBookCategoryId.sql

-- ========== 20260813120000_AddUserWalletSystem ==========
IF OBJECT_ID(N'[Teacher].[Teachers]', N'U') IS NOT NULL
BEGIN
    IF COL_LENGTH('Teacher.Teachers', 'ZibalSubMerchantId') IS NULL
        ALTER TABLE [Teacher].[Teachers] ADD [ZibalSubMerchantId] nvarchar(32) NULL;
END
GO

IF SCHEMA_ID(N'Finance') IS NULL EXEC(N'CREATE SCHEMA [Finance]');
GO

IF OBJECT_ID(N'[Finance].[UserWallets]', N'U') IS NULL
BEGIN
    CREATE TABLE [Finance].[UserWallets] (
        [Id] bigint NOT NULL IDENTITY(1, 1),
        [UserId] bigint NOT NULL,
        [IsPlatformWallet] bit NOT NULL CONSTRAINT [DF_UserWallets_IsPlatformWallet] DEFAULT 0,
        [AvailableBalanceToman] bigint NOT NULL CONSTRAINT [DF_UserWallets_AvailableBalanceToman] DEFAULT 0,
        [ReservedBalanceToman] bigint NOT NULL CONSTRAINT [DF_UserWallets_ReservedBalanceToman] DEFAULT 0,
        [TotalDepositedToman] bigint NOT NULL CONSTRAINT [DF_UserWallets_TotalDepositedToman] DEFAULT 0,
        [TotalSpentToman] bigint NOT NULL CONSTRAINT [DF_UserWallets_TotalSpentToman] DEFAULT 0,
        [TotalReceivedToman] bigint NOT NULL CONSTRAINT [DF_UserWallets_TotalReceivedToman] DEFAULT 0,
        [TotalWithdrawnToman] bigint NOT NULL CONSTRAINT [DF_UserWallets_TotalWithdrawnToman] DEFAULT 0,
        [ZibalSubMerchantId] nvarchar(32) NULL,
        [ZibalProvisionedAtUtc] datetime2 NULL,
        [LastPayoutRequestedAtUtc] datetime2 NULL,
        [IsSuspended] bit NOT NULL CONSTRAINT [DF_UserWallets_IsSuspended] DEFAULT 0,
        CONSTRAINT [PK_UserWallets] PRIMARY KEY ([Id])
    );
    CREATE UNIQUE INDEX [IX_UserWallets_UserId] ON [Finance].[UserWallets] ([UserId]);
END
GO

IF OBJECT_ID(N'[Finance].[WalletTransactions]', N'U') IS NULL
BEGIN
    CREATE TABLE [Finance].[WalletTransactions] (
        [Id] bigint NOT NULL IDENTITY(1, 1),
        [WalletId] bigint NOT NULL,
        [UserId] bigint NOT NULL,
        [Type] int NOT NULL,
        [AmountToman] bigint NOT NULL,
        [BalanceAfterToman] bigint NOT NULL,
        [Reference] nvarchar(200) NOT NULL,
        [Description] nvarchar(500) NULL,
        [CounterpartyUserId] bigint NULL,
        [CreatedAtUtc] datetime2 NOT NULL,
        CONSTRAINT [PK_WalletTransactions] PRIMARY KEY ([Id])
    );
    CREATE UNIQUE INDEX [IX_WalletTransactions_Reference] ON [Finance].[WalletTransactions] ([Reference]);
    CREATE INDEX [IX_WalletTransactions_UserId_CreatedAtUtc] ON [Finance].[WalletTransactions] ([UserId], [CreatedAtUtc]);
END
GO

IF NOT EXISTS (SELECT 1 FROM [Finance].[UserWallets] WHERE [UserId] = 0 AND [IsPlatformWallet] = 1)
    INSERT INTO [Finance].[UserWallets]
        ([UserId], [IsPlatformWallet], [AvailableBalanceToman], [ReservedBalanceToman],
         [TotalDepositedToman], [TotalSpentToman], [TotalReceivedToman], [TotalWithdrawnToman], [IsSuspended])
    VALUES (0, 1, 0, 0, 0, 0, 0, 0, 0);
GO

IF NOT EXISTS (SELECT 1 FROM [__EFMigrationsHistory] WHERE [MigrationId] = N'20260813120000_AddUserWalletSystem')
    INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
    VALUES (N'20260813120000_AddUserWalletSystem', N'9.0.3');
GO

-- ========== 20260813140000_AddTeacherBookFormatFiles ==========
IF OBJECT_ID(N'[Teacher].[Books]', N'U') IS NOT NULL
BEGIN
    IF COL_LENGTH('Teacher.Books', 'PdfFileUrl') IS NULL
        ALTER TABLE [Teacher].[Books] ADD [PdfFileUrl] nvarchar(2000) NULL;
    IF COL_LENGTH('Teacher.Books', 'PdfFileName') IS NULL
        ALTER TABLE [Teacher].[Books] ADD [PdfFileName] nvarchar(260) NULL;
    IF COL_LENGTH('Teacher.Books', 'EpubFileUrl') IS NULL
        ALTER TABLE [Teacher].[Books] ADD [EpubFileUrl] nvarchar(2000) NULL;
    IF COL_LENGTH('Teacher.Books', 'EpubFileName') IS NULL
        ALTER TABLE [Teacher].[Books] ADD [EpubFileName] nvarchar(260) NULL;
    IF COL_LENGTH('Teacher.Books', 'WordFileUrl') IS NULL
        ALTER TABLE [Teacher].[Books] ADD [WordFileUrl] nvarchar(2000) NULL;
    IF COL_LENGTH('Teacher.Books', 'WordFileName') IS NULL
        ALTER TABLE [Teacher].[Books] ADD [WordFileName] nvarchar(260) NULL;
END
GO

IF NOT EXISTS (SELECT 1 FROM [__EFMigrationsHistory] WHERE [MigrationId] = N'20260813140000_AddTeacherBookFormatFiles')
    INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
    VALUES (N'20260813140000_AddTeacherBookFormatFiles', N'9.0.3');
GO

-- ========== 20260814120000_AddTeacherBookCategoryId ==========
IF OBJECT_ID(N'[Teacher].[Books]', N'U') IS NOT NULL
BEGIN
    IF COL_LENGTH('Teacher.Books', 'CategoryId') IS NULL
        ALTER TABLE [Teacher].[Books] ADD [CategoryId] bigint NULL;

    IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'IX_Books_CategoryId' AND object_id = OBJECT_ID(N'[Teacher].[Books]'))
        CREATE INDEX [IX_Books_CategoryId] ON [Teacher].[Books] ([CategoryId]);

    IF NOT EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = N'FK_Books_Categories_CategoryId' AND parent_object_id = OBJECT_ID(N'[Teacher].[Books]'))
        ALTER TABLE [Teacher].[Books]
            ADD CONSTRAINT [FK_Books_Categories_CategoryId]
            FOREIGN KEY ([CategoryId]) REFERENCES [Category].[Categories] ([Id]) ON DELETE SET NULL;
END
GO

IF NOT EXISTS (SELECT 1 FROM [__EFMigrationsHistory] WHERE [MigrationId] = N'20260814120000_AddTeacherBookCategoryId')
    INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
    VALUES (N'20260814120000_AddTeacherBookCategoryId', N'9.0.3');
GO

-- ========== 20260815120000_AddSoftwareProducts ==========
IF SCHEMA_ID(N'Software') IS NULL EXEC(N'CREATE SCHEMA [Software]');
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

IF NOT EXISTS (SELECT 1 FROM [__EFMigrationsHistory] WHERE [MigrationId] = N'20260815120000_AddSoftwareProducts')
    INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
    VALUES (N'20260815120000_AddSoftwareProducts', N'9.0.3');
GO

PRINT N'Done. Verify with: SELECT COL_LENGTH(''Teacher.Books'', ''CategoryId'');';
