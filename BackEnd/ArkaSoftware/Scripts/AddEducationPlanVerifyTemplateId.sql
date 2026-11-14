-- Adds SMS.ir verify template id for private education plan assignment SMS.
-- Template parameters in SMS.ir panel: FULLNAME, TITLE

IF OBJECT_ID(N'Website.NotificationSettings', N'U') IS NOT NULL
   AND COL_LENGTH(N'Website.NotificationSettings', N'EducationPlanVerifyTemplateId') IS NULL
BEGIN
    ALTER TABLE Website.NotificationSettings
        ADD EducationPlanVerifyTemplateId INT NOT NULL
            CONSTRAINT DF_NotificationSettings_EducationPlanVerifyTemplateId DEFAULT (0);
END

PRINT 'EducationPlanVerifyTemplateId column is ready. Set the template id in Admin > Settings > Notifications.';
