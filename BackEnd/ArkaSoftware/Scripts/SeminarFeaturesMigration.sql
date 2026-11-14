-- Run once on the production database before deploying the API update.
IF NOT EXISTS (
    SELECT 1 FROM sys.columns
    WHERE object_id = OBJECT_ID(N'Seminar.Seminars') AND name = N'RecordingVideoUrl'
)
BEGIN
    ALTER TABLE Seminar.Seminars ADD RecordingVideoUrl NVARCHAR(500) NULL;
END
GO

IF NOT EXISTS (
    SELECT 1 FROM sys.columns
    WHERE object_id = OBJECT_ID(N'Seminar.Seminars') AND name = N'IsPublic'
)
BEGIN
    ALTER TABLE Seminar.Seminars ADD IsPublic BIT NOT NULL CONSTRAINT DF_Seminars_IsPublic DEFAULT (1);
END
GO
