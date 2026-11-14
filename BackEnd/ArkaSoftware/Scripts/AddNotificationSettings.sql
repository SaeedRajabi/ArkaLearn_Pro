-- Run on ArkaSoftwareCMP database before using SMS notification settings.
-- Column layout matches EF Core auditable entities (BusinessId, CreatedDateTime, etc.).

IF NOT EXISTS (SELECT 1 FROM sys.schemas WHERE name = N'Website')
    EXEC('CREATE SCHEMA Website');

IF OBJECT_ID(N'Website.NotificationSettings', N'U') IS NULL
BEGIN
    CREATE TABLE Website.NotificationSettings
    (
        Id BIGINT IDENTITY(1,1) NOT NULL PRIMARY KEY,
        BusinessId UNIQUEIDENTIFIER NOT NULL,
        IsEnabled BIT NOT NULL CONSTRAINT DF_NotificationSettings_IsEnabled DEFAULT (0),
        ApiKey NVARCHAR(500) NOT NULL CONSTRAINT DF_NotificationSettings_ApiKey DEFAULT (N''),
        LineNumber BIGINT NOT NULL CONSTRAINT DF_NotificationSettings_LineNumber DEFAULT (0),
        RegistrationOtpEnabled BIT NOT NULL CONSTRAINT DF_NotificationSettings_RegistrationOtpEnabled DEFAULT (0),
        RegistrationVerifyTemplateId INT NOT NULL CONSTRAINT DF_NotificationSettings_RegistrationVerifyTemplateId DEFAULT (0),
        PhoneChangeOtpEnabled BIT NOT NULL CONSTRAINT DF_NotificationSettings_PhoneChangeOtpEnabled DEFAULT (0),
        PhoneChangeVerifyTemplateId INT NOT NULL CONSTRAINT DF_NotificationSettings_PhoneChangeVerifyTemplateId DEFAULT (0),
        EducationPlanSmsEnabled BIT NOT NULL CONSTRAINT DF_NotificationSettings_EducationPlanSmsEnabled DEFAULT (0),
        EducationPlanVerifyTemplateId INT NOT NULL CONSTRAINT DF_NotificationSettings_EducationPlanVerifyTemplateId DEFAULT (0),
        EducationPlanMessageTemplate NVARCHAR(MAX) NOT NULL CONSTRAINT DF_NotificationSettings_EducationPlanMessageTemplate DEFAULT (N''),
        OtpExpiryMinutes INT NOT NULL CONSTRAINT DF_NotificationSettings_OtpExpiryMinutes DEFAULT (10),
        OtpResendCooldownSeconds INT NOT NULL CONSTRAINT DF_NotificationSettings_OtpResendCooldownSeconds DEFAULT (120),
        CreatedByUserId NVARCHAR(50) NULL,
        CreatedDateTime DATETIME2 NULL,
        ModifiedByUserId NVARCHAR(50) NULL,
        ModifiedDateTime DATETIME2 NULL,
        IsDelete BIT NOT NULL CONSTRAINT DF_NotificationSettings_IsDelete DEFAULT (0),
        CONSTRAINT UQ_NotificationSettings_BusinessId UNIQUE (BusinessId)
    );
END

IF NOT EXISTS (SELECT 1 FROM Website.NotificationSettings)
BEGIN
    INSERT INTO Website.NotificationSettings
    (
        BusinessId,
        IsEnabled,
        ApiKey,
        LineNumber,
        RegistrationOtpEnabled,
        RegistrationVerifyTemplateId,
        PhoneChangeOtpEnabled,
        PhoneChangeVerifyTemplateId,
        EducationPlanSmsEnabled,
        EducationPlanVerifyTemplateId,
        EducationPlanMessageTemplate,
        OtpExpiryMinutes,
        OtpResendCooldownSeconds,
        CreatedDateTime,
        IsDelete
    )
    VALUES
    (
        NEWID(),
        0,
        N'',
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        N'',
        10,
        120,
        SYSUTCDATETIME(),
        0
    );
END
