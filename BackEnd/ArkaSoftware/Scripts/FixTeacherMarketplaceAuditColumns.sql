-- Fixes Teacher marketplace tables that were created with CreateAt instead of audit columns.
-- Safe to run multiple times (checks column existence before altering).

BEGIN TRANSACTION;
GO

DECLARE @tables TABLE (TableName sysname);
INSERT INTO @tables (TableName)
VALUES (N'TeachingCategories'), (N'PromotionalVideos'), (N'Books'), (N'PortfolioArticles');

DECLARE @table sysname;
DECLARE table_cursor CURSOR LOCAL FAST_FORWARD FOR SELECT TableName FROM @tables;
OPEN table_cursor;
FETCH NEXT FROM table_cursor INTO @table;

WHILE @@FETCH_STATUS = 0
BEGIN
    IF COL_LENGTH('Teacher.' + @table, 'CreateAt') IS NOT NULL
    BEGIN
        IF COL_LENGTH('Teacher.' + @table, 'CreatedByUserId') IS NULL
            EXEC(N'ALTER TABLE [Teacher].[' + @table + N'] ADD [CreatedByUserId] nvarchar(50) NULL');

        IF COL_LENGTH('Teacher.' + @table, 'CreatedDateTime') IS NULL
            EXEC(N'ALTER TABLE [Teacher].[' + @table + N'] ADD [CreatedDateTime] datetime2 NULL');

        IF COL_LENGTH('Teacher.' + @table, 'ModifiedByUserId') IS NULL
            EXEC(N'ALTER TABLE [Teacher].[' + @table + N'] ADD [ModifiedByUserId] nvarchar(50) NULL');

        IF COL_LENGTH('Teacher.' + @table, 'ModifiedDateTime') IS NULL
            EXEC(N'ALTER TABLE [Teacher].[' + @table + N'] ADD [ModifiedDateTime] datetime2 NULL');

        EXEC(N'
            UPDATE [Teacher].[' + @table + N']
            SET [CreatedDateTime] = [CreateAt]
            WHERE [CreatedDateTime] IS NULL');

        EXEC(N'ALTER TABLE [Teacher].[' + @table + N'] DROP COLUMN [CreateAt]');
    END

    FETCH NEXT FROM table_cursor INTO @table;
END

CLOSE table_cursor;
DEALLOCATE table_cursor;
GO

COMMIT TRANSACTION;
GO
