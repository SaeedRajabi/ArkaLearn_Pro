-- Extends EducationPlans for per-student private tutoring plans linked to online rooms.
IF NOT EXISTS (
    SELECT 1 FROM sys.columns
    WHERE object_id = OBJECT_ID(N'Education.EducationPlans') AND name = N'ManagedRoomStudentId'
)
BEGIN
    ALTER TABLE Education.EducationPlans ADD ManagedRoomStudentId BIGINT NULL;
END
GO

IF NOT EXISTS (
    SELECT 1 FROM sys.columns
    WHERE object_id = OBJECT_ID(N'Education.EducationPlans') AND name = N'RoomId'
)
BEGIN
    ALTER TABLE Education.EducationPlans ADD RoomId BIGINT NULL;
END
GO

IF NOT EXISTS (
    SELECT 1 FROM sys.columns
    WHERE object_id = OBJECT_ID(N'Education.EducationPlans') AND name = N'OwnerUserId'
)
BEGIN
    ALTER TABLE Education.EducationPlans ADD OwnerUserId BIGINT NULL;
END
GO

IF NOT EXISTS (
    SELECT 1 FROM sys.columns
    WHERE object_id = OBJECT_ID(N'Education.EducationPlans') AND name = N'StartDateUtc'
)
BEGIN
    ALTER TABLE Education.EducationPlans ADD StartDateUtc DATETIME2 NULL;
END
GO

IF NOT EXISTS (
    SELECT 1 FROM sys.columns
    WHERE object_id = OBJECT_ID(N'Education.EducationPlans') AND name = N'EndDateUtc'
)
BEGIN
    ALTER TABLE Education.EducationPlans ADD EndDateUtc DATETIME2 NULL;
END
GO

IF NOT EXISTS (
    SELECT 1 FROM sys.columns
    WHERE object_id = OBJECT_ID(N'Education.EducationPlans') AND name = N'UsedMinutes'
)
BEGIN
    ALTER TABLE Education.EducationPlans ADD UsedMinutes INT NOT NULL CONSTRAINT DF_EducationPlans_UsedMinutes DEFAULT 0;
END
GO

IF EXISTS (
    SELECT 1 FROM sys.indexes
    WHERE name = N'IX_EducationPlans_Title' AND object_id = OBJECT_ID(N'Education.EducationPlans')
)
BEGIN
    DROP INDEX IX_EducationPlans_Title ON Education.EducationPlans;
END
GO

IF NOT EXISTS (
    SELECT 1 FROM sys.tables WHERE name = N'EducationPlanSessionUsages' AND schema_id = SCHEMA_ID(N'Education')
)
BEGIN
    CREATE TABLE Education.EducationPlanSessionUsages (
        Id BIGINT IDENTITY(1,1) NOT NULL PRIMARY KEY,
        BusinessId UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID(),
        EducationPlanId BIGINT NOT NULL,
        RoomSessionId BIGINT NOT NULL,
        MinutesConsumed INT NOT NULL,
        ConsumedAtUtc DATETIME2 NOT NULL,
        IsDelete BIT NOT NULL DEFAULT 0,
        CreatedByUserId NVARCHAR(50) NULL,
        CreatedDateTime DATETIME2 NULL,
        ModifiedByUserId NVARCHAR(50) NULL,
        ModifiedDateTime DATETIME2 NULL,
        CONSTRAINT UQ_EducationPlanSessionUsages_PlanSession UNIQUE (EducationPlanId, RoomSessionId)
    );
END
GO
