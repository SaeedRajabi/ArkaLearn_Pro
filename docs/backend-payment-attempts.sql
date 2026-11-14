BEGIN TRANSACTION;
IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261025120000_AddTrackedPaymentAttempts'
)
BEGIN
    IF SCHEMA_ID(N'Finance') IS NULL EXEC(N'CREATE SCHEMA [Finance];');
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261025120000_AddTrackedPaymentAttempts'
)
BEGIN
    CREATE TABLE [Finance].[PaymentAttempts] (
        [OrderId] nvarchar(200) NOT NULL,
        [Provider] nvarchar(32) NOT NULL,
        [PaymentId] nvarchar(200) NULL,
        [ExpectedAmount] bigint NOT NULL,
        [AmountMultiplier] int NOT NULL,
        [TargetType] int NOT NULL,
        [TargetId] bigint NOT NULL,
        [UserId] bigint NOT NULL,
        [CreatedUtc] datetime2 NOT NULL,
        [ExpiresUtc] datetime2 NOT NULL,
        [Status] int NOT NULL,
        [LeaseId] uniqueidentifier NULL,
        [LeaseExpiresUtc] datetime2 NULL,
        [ReferenceNumber] nvarchar(200) NULL,
        [CardNumber] nvarchar(100) NULL,
        [ResultUrl] nvarchar(4000) NULL,
        [CompletedUtc] datetime2 NULL,
        CONSTRAINT [PK_PaymentAttempts] PRIMARY KEY ([OrderId])
    );
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261025120000_AddTrackedPaymentAttempts'
)
BEGIN
    EXEC(N'CREATE UNIQUE INDEX [IX_PaymentAttempts_Provider_PaymentId] ON [Finance].[PaymentAttempts] ([Provider], [PaymentId]) WHERE [PaymentId] IS NOT NULL');
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261025120000_AddTrackedPaymentAttempts'
)
BEGIN
    EXEC(N'CREATE UNIQUE INDEX [IX_PaymentAttempts_Provider_ReferenceNumber] ON [Finance].[PaymentAttempts] ([Provider], [ReferenceNumber]) WHERE [ReferenceNumber] IS NOT NULL');
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261025120000_AddTrackedPaymentAttempts'
)
BEGIN
    INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
    VALUES (N'20261025120000_AddTrackedPaymentAttempts', N'9.0.3');
END;

COMMIT;
GO

