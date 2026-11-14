-- Desktop license management columns on Enrollment.Enrollments
-- Run on production if auto-migrate did not apply yet.

IF OBJECT_ID(N'[Enrollment].[Enrollments]', N'U') IS NULL
BEGIN
    RAISERROR('Table Enrollment.Enrollments does not exist.', 16, 1);
    RETURN;
END

IF COL_LENGTH(N'Enrollment.Enrollments', N'IsDesktopLicenseActive') IS NULL
    ALTER TABLE [Enrollment].[Enrollments]
        ADD [IsDesktopLicenseActive] bit NOT NULL CONSTRAINT [DF_Enrollments_IsDesktopLicenseActive] DEFAULT (1);

IF COL_LENGTH(N'Enrollment.Enrollments', N'DesktopLicenseExpiresAtUtc') IS NULL
    ALTER TABLE [Enrollment].[Enrollments]
        ADD [DesktopLicenseExpiresAtUtc] datetime2 NULL;

PRINT N'Desktop license management columns are ready.';
