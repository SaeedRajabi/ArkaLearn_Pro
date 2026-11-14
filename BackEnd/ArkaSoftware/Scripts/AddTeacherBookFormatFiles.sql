-- Migration: 20260813140000_AddTeacherBookFormatFiles
-- Adds Pdf/Epub/Word file columns on [Teacher].[Books]
-- Safe to run multiple times.

BEGIN TRANSACTION;
GO

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

    UPDATE [Teacher].[Books]
    SET [PdfFileUrl] = [BookFileUrl], [PdfFileName] = [BookFileName]
    WHERE [BookFileUrl] IS NOT NULL
      AND [PdfFileUrl] IS NULL
      AND (LOWER([BookFileName]) LIKE '%.pdf' OR LOWER([BookFileUrl]) LIKE '%.pdf');

    UPDATE [Teacher].[Books]
    SET [EpubFileUrl] = [BookFileUrl], [EpubFileName] = [BookFileName]
    WHERE [BookFileUrl] IS NOT NULL
      AND [PdfFileUrl] IS NULL
      AND [EpubFileUrl] IS NULL
      AND (LOWER([BookFileName]) LIKE '%.epub' OR LOWER([BookFileUrl]) LIKE '%.epub');

    UPDATE [Teacher].[Books]
    SET [WordFileUrl] = [BookFileUrl], [WordFileName] = [BookFileName]
    WHERE [BookFileUrl] IS NOT NULL
      AND [PdfFileUrl] IS NULL
      AND [EpubFileUrl] IS NULL
      AND [WordFileUrl] IS NULL
      AND (
            LOWER([BookFileName]) LIKE '%.doc'
         OR LOWER([BookFileName]) LIKE '%.docx'
         OR LOWER([BookFileUrl]) LIKE '%.doc'
         OR LOWER([BookFileUrl]) LIKE '%.docx'
      );
END
GO

IF NOT EXISTS (
    SELECT 1 FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260813140000_AddTeacherBookFormatFiles'
)
BEGIN
    INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
    VALUES (N'20260813140000_AddTeacherBookFormatFiles', N'9.0.3');
END
GO

COMMIT TRANSACTION;
GO
