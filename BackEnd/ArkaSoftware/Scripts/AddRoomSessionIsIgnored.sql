IF NOT EXISTS (
    SELECT 1 FROM sys.columns
    WHERE object_id = OBJECT_ID(N'dbo.RoomSessions') AND name = N'IsIgnored'
)
BEGIN
    ALTER TABLE dbo.RoomSessions ADD IsIgnored bit NOT NULL CONSTRAINT DF_RoomSessions_IsIgnored DEFAULT 0;
END
GO
