-- Migration: 20260814120000_AddTeacherBookCategoryId
-- Fixes: Invalid column name 'CategoryId' on [Teacher].[Books] during admin login
-- Safe to run multiple times.

BEGIN TRANSACTION;
GO

IF OBJECT_ID(N'[Teacher].[Books]', N'U') IS NOT NULL
BEGIN
    IF COL_LENGTH('Teacher.Books', 'CategoryId') IS NULL
        ALTER TABLE [Teacher].[Books] ADD [CategoryId] bigint NULL;

    IF NOT EXISTS (
        SELECT 1 FROM sys.indexes
        WHERE name = N'IX_Books_CategoryId'
          AND object_id = OBJECT_ID(N'[Teacher].[Books]')
    )
        CREATE INDEX [IX_Books_CategoryId] ON [Teacher].[Books] ([CategoryId]);

    IF NOT EXISTS (
        SELECT 1 FROM sys.foreign_keys
        WHERE name = N'FK_Books_Categories_CategoryId'
          AND parent_object_id = OBJECT_ID(N'[Teacher].[Books]')
    )
        ALTER TABLE [Teacher].[Books]
            ADD CONSTRAINT [FK_Books_Categories_CategoryId]
            FOREIGN KEY ([CategoryId]) REFERENCES [Category].[Categories] ([Id])
            ON DELETE SET NULL;
END
GO

IF NOT EXISTS (
    SELECT 1 FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260814120000_AddTeacherBookCategoryId'
)
BEGIN
    INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
    VALUES (N'20260814120000_AddTeacherBookCategoryId', N'9.0.3');
END
GO

COMMIT TRANSACTION;
GO

-- Verify:
-- SELECT COL_LENGTH('Teacher.Books', 'CategoryId') AS CategoryIdExists;
