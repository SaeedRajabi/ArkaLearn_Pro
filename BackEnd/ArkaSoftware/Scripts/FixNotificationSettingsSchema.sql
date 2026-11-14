-- Run this if NotificationSettings save returns HTTP 500.
-- Fixes tables created from an older script that used CreateAt instead of EF audit columns.

IF OBJECT_ID(N'Website.NotificationSettings', N'U') IS NULL
BEGIN
    RAISERROR('Table Website.NotificationSettings does not exist. Run AddNotificationSettings.sql first.', 16, 1);
    RETURN;
END

IF COL_LENGTH(N'Website.NotificationSettings', N'BusinessId') IS NULL
BEGIN
    ALTER TABLE Website.NotificationSettings
        ADD BusinessId UNIQUEIDENTIFIER NULL;

    UPDATE Website.NotificationSettings
    SET BusinessId = NEWID()
    WHERE BusinessId IS NULL;

    ALTER TABLE Website.NotificationSettings
        ALTER COLUMN BusinessId UNIQUEIDENTIFIER NOT NULL;

    IF NOT EXISTS (
        SELECT 1 FROM sys.indexes
        WHERE name = N'UQ_NotificationSettings_BusinessId'
          AND object_id = OBJECT_ID(N'Website.NotificationSettings'))
    BEGIN
        ALTER TABLE Website.NotificationSettings
            ADD CONSTRAINT UQ_NotificationSettings_BusinessId UNIQUE (BusinessId);
    END
END

IF COL_LENGTH(N'Website.NotificationSettings', N'CreatedByUserId') IS NULL
    ALTER TABLE Website.NotificationSettings ADD CreatedByUserId NVARCHAR(50) NULL;

IF COL_LENGTH(N'Website.NotificationSettings', N'CreatedDateTime') IS NULL
BEGIN
    ALTER TABLE Website.NotificationSettings ADD CreatedDateTime DATETIME2 NULL;

    IF COL_LENGTH(N'Website.NotificationSettings', N'CreateAt') IS NOT NULL
    BEGIN
        EXEC(N'
            UPDATE Website.NotificationSettings
            SET CreatedDateTime = CreateAt
            WHERE CreatedDateTime IS NULL AND CreateAt IS NOT NULL');
    END
END

IF COL_LENGTH(N'Website.NotificationSettings', N'ModifiedByUserId') IS NULL
    ALTER TABLE Website.NotificationSettings ADD ModifiedByUserId NVARCHAR(50) NULL;

IF COL_LENGTH(N'Website.NotificationSettings', N'ModifiedDateTime') IS NULL
    ALTER TABLE Website.NotificationSettings ADD ModifiedDateTime DATETIME2 NULL;

IF COL_LENGTH(N'Website.NotificationSettings', N'IsDelete') IS NULL
    ALTER TABLE Website.NotificationSettings
        ADD IsDelete BIT NOT NULL CONSTRAINT DF_NotificationSettings_IsDelete_Fix DEFAULT (0);

IF COL_LENGTH(N'Website.NotificationSettings', N'CreateAt') IS NOT NULL
BEGIN
    ALTER TABLE Website.NotificationSettings DROP COLUMN CreateAt;
END

PRINT 'Website.NotificationSettings schema is aligned with EF Core.';
