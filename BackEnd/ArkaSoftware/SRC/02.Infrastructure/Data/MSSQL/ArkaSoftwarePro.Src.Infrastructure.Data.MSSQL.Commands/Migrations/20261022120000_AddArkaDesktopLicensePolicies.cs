using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;
using ArkaSoftwarePro.Src.Infrastructure.Data.MSSQL.Commands.Common;

#nullable disable

namespace ArkaSoftwarePro.Src.Infrastructure.Data.MSSQL.Commands.Migrations;

[DbContext(typeof(ArkaSoftwareCommandDbContext))]
[Migration("20261022120000_AddArkaDesktopLicensePolicies")]
public partial class AddArkaDesktopLicensePolicies : Migration
{
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.Sql("""
IF OBJECT_ID(N'[Enrollment].[Enrollments]', N'U') IS NOT NULL
BEGIN
    IF COL_LENGTH(N'Enrollment.Enrollments', N'DesktopLicenseMaxDevices') IS NULL
        ALTER TABLE [Enrollment].[Enrollments] ADD [DesktopLicenseMaxDevices] int NOT NULL CONSTRAINT DF_Enroll_DesktopMaxDevices DEFAULT(1);
    IF COL_LENGTH(N'Enrollment.Enrollments', N'DesktopLicenseAllowedOs') IS NULL
        ALTER TABLE [Enrollment].[Enrollments] ADD [DesktopLicenseAllowedOs] tinyint NOT NULL CONSTRAINT DF_Enroll_DesktopAllowedOs DEFAULT(1);
    IF COL_LENGTH(N'Enrollment.Enrollments', N'DesktopContentAccessMode') IS NULL
        ALTER TABLE [Enrollment].[Enrollments] ADD [DesktopContentAccessMode] tinyint NOT NULL CONSTRAINT DF_Enroll_DesktopContentMode DEFAULT(0);
END

IF OBJECT_ID(N'[Course].[DesktopWatermarkPolicies]', N'U') IS NULL
BEGIN
    CREATE TABLE [Course].[DesktopWatermarkPolicies] (
        [Id] bigint NOT NULL IDENTITY(1,1),
        [CourseId] bigint NOT NULL,
        [TextTemplate] nvarchar(500) NOT NULL,
        [FontSize] int NOT NULL,
        [FontColor] nvarchar(32) NOT NULL,
        [Opacity] float NOT NULL,
        [Position] tinyint NOT NULL,
        [RotationDeg] float NOT NULL,
        [Movement] tinyint NOT NULL,
        [PaddingPx] int NOT NULL,
        [UpdatedAtUtc] datetime2 NOT NULL,
        [IsDeleted] bit NOT NULL CONSTRAINT DF_Course_WmPolicy_IsDeleted DEFAULT(0),
        CONSTRAINT [PK_DesktopWatermarkPolicies] PRIMARY KEY ([Id])
    );
    CREATE UNIQUE INDEX [IX_DesktopWatermarkPolicies_CourseId] ON [Course].[DesktopWatermarkPolicies]([CourseId]);
END

IF OBJECT_ID(N'[Desktop].[DesktopLicenseDeviceBindings]', N'U') IS NULL
BEGIN
    CREATE TABLE [Desktop].[DesktopLicenseDeviceBindings] (
        [Id] bigint NOT NULL IDENTITY(1,1),
        [EnrollmentId] bigint NOT NULL,
        [DeviceId] nvarchar(128) NOT NULL,
        [OsFamily] tinyint NOT NULL,
        [MachineName] nvarchar(200) NULL,
        [ActivatedAtUtc] datetime2 NOT NULL,
        [RevokedAtUtc] datetime2 NULL,
        [RevokeReason] nvarchar(500) NULL,
        [IsDeleted] bit NOT NULL CONSTRAINT DF_Desktop_LicBind_IsDeleted DEFAULT(0),
        CONSTRAINT [PK_DesktopLicenseDeviceBindings] PRIMARY KEY ([Id])
    );
    CREATE INDEX [IX_DesktopLicenseDeviceBindings_Enrollment_Device]
        ON [Desktop].[DesktopLicenseDeviceBindings]([EnrollmentId], [DeviceId]);
END

IF OBJECT_ID(N'[Desktop].[DesktopLicenseLessonAccess]', N'U') IS NULL
BEGIN
    CREATE TABLE [Desktop].[DesktopLicenseLessonAccess] (
        [Id] bigint NOT NULL IDENTITY(1,1),
        [EnrollmentId] bigint NOT NULL,
        [LessonId] bigint NOT NULL,
        [IsDeleted] bit NOT NULL CONSTRAINT DF_Desktop_LessonAccess_IsDeleted DEFAULT(0),
        CONSTRAINT [PK_DesktopLicenseLessonAccess] PRIMARY KEY ([Id])
    );
    CREATE UNIQUE INDEX [IX_DesktopLicenseLessonAccess_Enrollment_Lesson]
        ON [Desktop].[DesktopLicenseLessonAccess]([EnrollmentId], [LessonId]);
END

IF OBJECT_ID(N'[Desktop].[TeacherStudentRatings]', N'U') IS NULL
BEGIN
    CREATE TABLE [Desktop].[TeacherStudentRatings] (
        [Id] bigint NOT NULL IDENTITY(1,1),
        [CourseId] bigint NOT NULL,
        [EnrollmentId] bigint NOT NULL,
        [TeacherUserId] bigint NOT NULL,
        [StudentUserId] bigint NOT NULL,
        [Score] tinyint NOT NULL,
        [Note] nvarchar(2000) NULL,
        [UpdatedAtUtc] datetime2 NOT NULL,
        [IsDeleted] bit NOT NULL CONSTRAINT DF_Desktop_TeacherRating_IsDeleted DEFAULT(0),
        CONSTRAINT [PK_TeacherStudentRatings] PRIMARY KEY ([Id])
    );
    CREATE UNIQUE INDEX [IX_TeacherStudentRatings_Enrollment_Teacher]
        ON [Desktop].[TeacherStudentRatings]([EnrollmentId], [TeacherUserId]);
END

IF OBJECT_ID(N'[Desktop].[DesktopPlaybackEvents]', N'U') IS NULL
BEGIN
    CREATE TABLE [Desktop].[DesktopPlaybackEvents] (
        [Id] bigint NOT NULL IDENTITY(1,1),
        [UserId] bigint NOT NULL,
        [CourseId] bigint NOT NULL,
        [LessonId] bigint NOT NULL,
        [EnrollmentId] bigint NULL,
        [DeviceId] nvarchar(128) NULL,
        [Kind] tinyint NOT NULL,
        [PositionSeconds] int NOT NULL,
        [WatchedDeltaSeconds] int NOT NULL,
        [CreatedAtUtc] datetime2 NOT NULL,
        [IsDeleted] bit NOT NULL CONSTRAINT DF_Desktop_PlaybackEvt_IsDeleted DEFAULT(0),
        CONSTRAINT [PK_DesktopPlaybackEvents] PRIMARY KEY ([Id])
    );
    CREATE INDEX [IX_DesktopPlaybackEvents_Course_Lesson_Created]
        ON [Desktop].[DesktopPlaybackEvents]([CourseId], [LessonId], [CreatedAtUtc]);
END

-- Migrate legacy single-device binds into multi-device table
IF OBJECT_ID(N'[Desktop].[DesktopLicenseDeviceBindings]', N'U') IS NOT NULL
   AND COL_LENGTH(N'Enrollment.Enrollments', N'DesktopLicenseBoundDeviceId') IS NOT NULL
BEGIN
    INSERT INTO [Desktop].[DesktopLicenseDeviceBindings]
        ([EnrollmentId], [DeviceId], [OsFamily], [MachineName], [ActivatedAtUtc], [RevokedAtUtc], [RevokeReason], [IsDeleted])
    SELECT e.[Id], e.[DesktopLicenseBoundDeviceId], 1, NULL, SYSUTCDATETIME(), NULL, NULL, 0
    FROM [Enrollment].[Enrollments] e
    WHERE e.[DesktopLicenseBoundDeviceId] IS NOT NULL
      AND LEN(LTRIM(RTRIM(e.[DesktopLicenseBoundDeviceId]))) > 0
      AND NOT EXISTS (
          SELECT 1 FROM [Desktop].[DesktopLicenseDeviceBindings] b
          WHERE b.[EnrollmentId] = e.[Id] AND b.[DeviceId] = e.[DesktopLicenseBoundDeviceId] AND b.[IsDeleted] = 0
      );
END
""");
    }

    protected override void Down(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.Sql("""
IF OBJECT_ID(N'[Desktop].[DesktopPlaybackEvents]', N'U') IS NOT NULL DROP TABLE [Desktop].[DesktopPlaybackEvents];
IF OBJECT_ID(N'[Desktop].[TeacherStudentRatings]', N'U') IS NOT NULL DROP TABLE [Desktop].[TeacherStudentRatings];
IF OBJECT_ID(N'[Desktop].[DesktopLicenseLessonAccess]', N'U') IS NOT NULL DROP TABLE [Desktop].[DesktopLicenseLessonAccess];
IF OBJECT_ID(N'[Desktop].[DesktopLicenseDeviceBindings]', N'U') IS NOT NULL DROP TABLE [Desktop].[DesktopLicenseDeviceBindings];
IF OBJECT_ID(N'[Course].[DesktopWatermarkPolicies]', N'U') IS NOT NULL DROP TABLE [Course].[DesktopWatermarkPolicies];
IF COL_LENGTH(N'Enrollment.Enrollments', N'DesktopContentAccessMode') IS NOT NULL
    ALTER TABLE [Enrollment].[Enrollments] DROP COLUMN [DesktopContentAccessMode];
IF COL_LENGTH(N'Enrollment.Enrollments', N'DesktopLicenseAllowedOs') IS NOT NULL
    ALTER TABLE [Enrollment].[Enrollments] DROP COLUMN [DesktopLicenseAllowedOs];
IF COL_LENGTH(N'Enrollment.Enrollments', N'DesktopLicenseMaxDevices') IS NOT NULL
    ALTER TABLE [Enrollment].[Enrollments] DROP COLUMN [DesktopLicenseMaxDevices];
""");
    }
}
