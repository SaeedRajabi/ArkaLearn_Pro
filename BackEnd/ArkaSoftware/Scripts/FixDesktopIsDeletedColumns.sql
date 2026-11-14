-- Fix Desktop schema soft-delete column naming.
-- EF AggregateRoot uses property IsDelete; Desktop (and Media) columns use IsDeleted.
-- Safe / idempotent: rename IsDelete → IsDeleted when needed, or add IsDeleted if neither exists.

SET NOCOUNT ON;

IF NOT EXISTS (SELECT 1 FROM sys.schemas WHERE name = N'Desktop')
    EXEC(N'CREATE SCHEMA [Desktop]');

DECLARE @tables TABLE (TableName sysname PRIMARY KEY);
INSERT INTO @tables (TableName) VALUES
    (N'DesktopAppLicenses'),
    (N'OfflinePlaybackGrants'),
    (N'DesktopDeviceRegistrations'),
    (N'DesktopAccessBlocks'),
    (N'RemoteAssistSessions'),
    (N'DesktopAppReleases'),
    (N'MediaContentKeys');

DECLARE @table sysname;
DECLARE @full nvarchar(300);
DECLARE @sql nvarchar(max);

DECLARE cur CURSOR LOCAL FAST_FORWARD FOR SELECT TableName FROM @tables;
OPEN cur;
FETCH NEXT FROM cur INTO @table;

WHILE @@FETCH_STATUS = 0
BEGIN
    SET @full = N'Desktop.' + @table;

    IF OBJECT_ID(@full, N'U') IS NULL
    BEGIN
        PRINT N'SKIP (missing table): ' + @full;
        FETCH NEXT FROM cur INTO @table;
        CONTINUE;
    END

    IF COL_LENGTH(@full, N'IsDeleted') IS NULL AND COL_LENGTH(@full, N'IsDelete') IS NOT NULL
    BEGIN
        SET @sql = N'EXEC sp_rename N''' + @full + N'.IsDelete'', N''IsDeleted'', N''COLUMN'';';
        EXEC(@sql);
        PRINT N'RENAMED IsDelete → IsDeleted: ' + @full;
    END
    ELSE IF COL_LENGTH(@full, N'IsDeleted') IS NULL AND COL_LENGTH(@full, N'IsDelete') IS NULL
    BEGIN
        SET @sql = N'ALTER TABLE [' + N'Desktop' + N'].[' + @table + N']
            ADD [IsDeleted] bit NOT NULL CONSTRAINT [DF_' + @table + N'_IsDeleted] DEFAULT (0);';
        EXEC(@sql);
        PRINT N'ADDED IsDeleted: ' + @full;
    END
    ELSE
    BEGIN
        PRINT N'OK IsDeleted present: ' + @full;
    END

    FETCH NEXT FROM cur INTO @table;
END

CLOSE cur;
DEALLOCATE cur;

PRINT N'Done. Restart API and retry desktop offline grant / playback.';
