using Microsoft.EntityFrameworkCore.Migrations;
using Microsoft.EntityFrameworkCore.Infrastructure;
using ArkaSoftwarePro.Src.Infrastructure.Data.MSSQL.Commands.Common;

#nullable disable

namespace ArkaSoftwarePro.Src.Infrastructure.Data.MSSQL.Commands.Migrations;

[DbContext(typeof(ArkaSoftwareCommandDbContext))]
[Migration("20260718193000_AddCourseInstallmentSales")]
public partial class AddCourseInstallmentSales : Migration
{
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.Sql("""
            IF COL_LENGTH('Course.Courses', 'PaymentType') IS NULL
            BEGIN
                ALTER TABLE [Course].[Courses]
                ADD [PaymentType] tinyint NOT NULL CONSTRAINT [DF_Courses_PaymentType] DEFAULT (0);
            END
            """);

        migrationBuilder.Sql("""
            IF OBJECT_ID(N'[Course].[CourseInstallmentPlans]', N'U') IS NULL
            BEGIN
                CREATE TABLE [Course].[CourseInstallmentPlans]
                (
                    [Id] bigint NOT NULL IDENTITY(1,1),
                    [CourseId] bigint NOT NULL,
                    [InstallmentNumber] int NOT NULL,
                    [AmountToman] DECIMAL(18,0) NOT NULL,
                    [DueDateUtc] datetime2 NULL,
                    [CreatedByUserId] nvarchar(50) NULL,
                    [CreatedDateTime] datetime2 NULL,
                    [ModifiedByUserId] nvarchar(50) NULL,
                    [ModifiedDateTime] datetime2 NULL,
                    [IsDelete] bit NOT NULL CONSTRAINT [DF_CourseInstallmentPlans_IsDelete] DEFAULT (0),
                    [BusinessId] uniqueidentifier NOT NULL,
                    CONSTRAINT [PK_CourseInstallmentPlans] PRIMARY KEY ([Id]),
                    CONSTRAINT [FK_CourseInstallmentPlans_Courses_CourseId]
                        FOREIGN KEY ([CourseId]) REFERENCES [Course].[Courses]([Id]) ON DELETE CASCADE
                );
                CREATE UNIQUE INDEX [IX_CourseInstallmentPlans_CourseId_InstallmentNumber]
                    ON [Course].[CourseInstallmentPlans]([CourseId], [InstallmentNumber]);
            END
            """);

        migrationBuilder.Sql("""
            IF COL_LENGTH('Enrollment.Installments', 'InstallmentNumber') IS NULL
                ALTER TABLE [Enrollment].[Installments] ADD [InstallmentNumber] int NOT NULL CONSTRAINT [DF_Installments_InstallmentNumber] DEFAULT (1);
            IF COL_LENGTH('Enrollment.Installments', 'PaymentReference') IS NULL
                ALTER TABLE [Enrollment].[Installments] ADD [PaymentReference] nvarchar(200) NULL;
            IF COL_LENGTH('Enrollment.Installments', 'ReminderTwoDaysSentAtUtc') IS NULL
                ALTER TABLE [Enrollment].[Installments] ADD [ReminderTwoDaysSentAtUtc] datetime2 NULL;
            IF COL_LENGTH('Enrollment.Installments', 'ReminderOneDaySentAtUtc') IS NULL
                ALTER TABLE [Enrollment].[Installments] ADD [ReminderOneDaySentAtUtc] datetime2 NULL;
            IF COL_LENGTH('Enrollment.Installments', 'ReminderDueDaySentAtUtc') IS NULL
                ALTER TABLE [Enrollment].[Installments] ADD [ReminderDueDaySentAtUtc] datetime2 NULL;
            """);

        migrationBuilder.Sql("""
            IF NOT EXISTS (
                SELECT 1 FROM sys.indexes
                WHERE name = N'IX_Installments_EnrollmentId_InstallmentNumber'
                  AND object_id = OBJECT_ID(N'[Enrollment].[Installments]')
            )
            BEGIN
                CREATE INDEX [IX_Installments_EnrollmentId_InstallmentNumber]
                    ON [Enrollment].[Installments]([EnrollmentId], [InstallmentNumber]);
            END
            IF NOT EXISTS (
                SELECT 1 FROM sys.indexes
                WHERE name = N'IX_Installments_DueDate'
                  AND object_id = OBJECT_ID(N'[Enrollment].[Installments]')
            )
            BEGIN
                CREATE INDEX [IX_Installments_DueDate]
                    ON [Enrollment].[Installments]([DueDate]);
            END
            """);
    }

    protected override void Down(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.Sql("""
            IF OBJECT_ID(N'[Course].[CourseInstallmentPlans]', N'U') IS NOT NULL
                DROP TABLE [Course].[CourseInstallmentPlans];
            """);

        migrationBuilder.Sql("""
            IF COL_LENGTH('Course.Courses', 'PaymentType') IS NOT NULL
            BEGIN
                DECLARE @df sysname;
                SELECT @df = dc.name
                FROM sys.default_constraints dc
                INNER JOIN sys.columns c ON c.default_object_id = dc.object_id
                WHERE dc.parent_object_id = OBJECT_ID(N'[Course].[Courses]') AND c.name = N'PaymentType';
                IF @df IS NOT NULL EXEC(N'ALTER TABLE [Course].[Courses] DROP CONSTRAINT [' + @df + N']');
                ALTER TABLE [Course].[Courses] DROP COLUMN [PaymentType];
            END
            """);

        migrationBuilder.Sql("""
            IF EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'IX_Installments_DueDate' AND object_id = OBJECT_ID(N'[Enrollment].[Installments]'))
                DROP INDEX [IX_Installments_DueDate] ON [Enrollment].[Installments];
            IF EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'IX_Installments_EnrollmentId_InstallmentNumber' AND object_id = OBJECT_ID(N'[Enrollment].[Installments]'))
                DROP INDEX [IX_Installments_EnrollmentId_InstallmentNumber] ON [Enrollment].[Installments];
            """);

        migrationBuilder.Sql("""
            IF COL_LENGTH('Enrollment.Installments', 'ReminderDueDaySentAtUtc') IS NOT NULL
                ALTER TABLE [Enrollment].[Installments] DROP COLUMN [ReminderDueDaySentAtUtc];
            IF COL_LENGTH('Enrollment.Installments', 'ReminderOneDaySentAtUtc') IS NOT NULL
                ALTER TABLE [Enrollment].[Installments] DROP COLUMN [ReminderOneDaySentAtUtc];
            IF COL_LENGTH('Enrollment.Installments', 'ReminderTwoDaysSentAtUtc') IS NOT NULL
                ALTER TABLE [Enrollment].[Installments] DROP COLUMN [ReminderTwoDaysSentAtUtc];
            IF COL_LENGTH('Enrollment.Installments', 'PaymentReference') IS NOT NULL
                ALTER TABLE [Enrollment].[Installments] DROP COLUMN [PaymentReference];
            IF COL_LENGTH('Enrollment.Installments', 'InstallmentNumber') IS NOT NULL
            BEGIN
                DECLARE @df2 sysname;
                SELECT @df2 = dc.name
                FROM sys.default_constraints dc
                INNER JOIN sys.columns c ON c.default_object_id = dc.object_id
                WHERE dc.parent_object_id = OBJECT_ID(N'[Enrollment].[Installments]') AND c.name = N'InstallmentNumber';
                IF @df2 IS NOT NULL EXEC(N'ALTER TABLE [Enrollment].[Installments] DROP CONSTRAINT [' + @df2 + N']');
                ALTER TABLE [Enrollment].[Installments] DROP COLUMN [InstallmentNumber];
            END
            """);
    }
}
