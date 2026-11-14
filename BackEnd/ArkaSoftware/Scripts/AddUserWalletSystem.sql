-- Migration: 20260813120000_AddUserWalletSystem
-- Fixes: Invalid column name 'ZibalSubMerchantId' on [Teacher].[Teachers] during login
-- Safe to run multiple times.

BEGIN TRANSACTION;
GO

IF OBJECT_ID(N'[Teacher].[Teachers]', N'U') IS NOT NULL
BEGIN
    IF COL_LENGTH('Teacher.Teachers', 'ZibalSubMerchantId') IS NULL
        ALTER TABLE [Teacher].[Teachers] ADD [ZibalSubMerchantId] nvarchar(32) NULL;
END
GO

IF SCHEMA_ID(N'Finance') IS NULL
    EXEC(N'CREATE SCHEMA [Finance]');
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
BEGIN
    INSERT INTO [Finance].[UserWallets]
        ([UserId], [IsPlatformWallet], [AvailableBalanceToman], [ReservedBalanceToman],
         [TotalDepositedToman], [TotalSpentToman], [TotalReceivedToman], [TotalWithdrawnToman], [IsSuspended])
    VALUES (0, 1, 0, 0, 0, 0, 0, 0, 0);
END
GO

IF NOT EXISTS (
    SELECT 1 FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260813120000_AddUserWalletSystem'
)
BEGIN
    INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
    VALUES (N'20260813120000_AddUserWalletSystem', N'9.0.3');
END
GO

COMMIT TRANSACTION;
GO
