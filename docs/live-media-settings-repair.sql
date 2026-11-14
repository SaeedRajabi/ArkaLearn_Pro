-- Targeted LiveMedia schema repair; does not change EF migration history.
-- Back up and verify the target database before execution.
SET XACT_ABORT ON;
BEGIN TRANSACTION;
IF SCHEMA_ID(N'Website') IS NULL EXEC(N'CREATE SCHEMA [Website]');
            IF OBJECT_ID(N'[Website].[LiveMediaTransportSettings]', N'U') IS NULL
            BEGIN
                CREATE TABLE [Website].[LiveMediaTransportSettings] (
                    [Id] bigint IDENTITY(1,1) NOT NULL CONSTRAINT [PK_LiveMediaTransportSettings] PRIMARY KEY,
                    [TransportMode] nvarchar(32) NOT NULL CONSTRAINT [DF_LiveMediaTransportSettings_TransportMode] DEFAULT N'Mesh',
                    [LiveKitUrl] nvarchar(512) NULL,
                    [LiveKitApiKey] nvarchar(256) NULL,
                    [LiveKitApiSecretEncrypted] nvarchar(512) NULL,
                    [CreatedByUserId] nvarchar(50) NULL,
                    [CreatedDateTime] datetime2 NULL,
                    [ModifiedByUserId] nvarchar(50) NULL,
                    [ModifiedDateTime] datetime2 NULL,
                    [IsDelete] bit NOT NULL,
                    [BusinessId] uniqueidentifier NOT NULL
                );
            END;
            IF COL_LENGTH(N'Website.LiveMediaTransportSettings', N'TurnUrl') IS NULL
                ALTER TABLE [Website].[LiveMediaTransportSettings] ADD [TurnUrl] nvarchar(512) NULL;
            IF COL_LENGTH(N'Website.LiveMediaTransportSettings', N'TurnUsername') IS NULL
                ALTER TABLE [Website].[LiveMediaTransportSettings] ADD [TurnUsername] nvarchar(128) NULL;
            IF COL_LENGTH(N'Website.LiveMediaTransportSettings', N'TurnPasswordEncrypted') IS NULL
                ALTER TABLE [Website].[LiveMediaTransportSettings] ADD [TurnPasswordEncrypted] nvarchar(512) NULL;
            IF COL_LENGTH(N'Website.LiveMediaTransportSettings', N'StunUrls') IS NULL
                ALTER TABLE [Website].[LiveMediaTransportSettings] ADD [StunUrls] nvarchar(512) NULL;
COMMIT TRANSACTION;
