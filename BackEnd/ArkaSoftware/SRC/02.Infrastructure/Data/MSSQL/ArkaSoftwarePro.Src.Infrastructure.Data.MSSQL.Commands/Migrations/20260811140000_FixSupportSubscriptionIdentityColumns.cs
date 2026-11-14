using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;
using ArkaSoftwarePro.Src.Infrastructure.Data.MSSQL.Commands.Common;

#nullable disable

namespace ArkaSoftwarePro.Src.Infrastructure.Data.MSSQL.Commands.Migrations;

/// <summary>
/// Recreates Support subscription tables when Id columns were created without IDENTITY.
/// </summary>
[DbContext(typeof(ArkaSoftwareCommandDbContext))]
[Migration("20260811140000_FixSupportSubscriptionIdentityColumns")]
public partial class FixSupportSubscriptionIdentityColumns : Migration
{
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.Sql("""
            IF OBJECT_ID(N'[Support].[SupportPlanTariffs]', N'U') IS NOT NULL
            AND EXISTS (
                SELECT 1
                FROM sys.columns c
                INNER JOIN sys.tables t ON c.object_id = t.object_id
                INNER JOIN sys.schemas s ON t.schema_id = s.schema_id
                WHERE s.name = N'Support'
                  AND t.name = N'SupportPlanTariffs'
                  AND c.name = N'Id'
                  AND c.is_identity = 0
            )
            BEGIN
                IF EXISTS (SELECT 1 FROM [Support].[StudentSupportSubscriptions])
                    OR EXISTS (SELECT 1 FROM [Support].[StudentSupportFreezeRecords])
                    RAISERROR(
                        N'Support subscription tables contain data but Id columns lack IDENTITY. Manual migration required.',
                        16,
                        1);

                IF OBJECT_ID(N'[Support].[StudentSupportFreezeRecords]', N'U') IS NOT NULL
                    DROP TABLE [Support].[StudentSupportFreezeRecords];

                IF OBJECT_ID(N'[Support].[StudentSupportSubscriptions]', N'U') IS NOT NULL
                    DROP TABLE [Support].[StudentSupportSubscriptions];

                DROP TABLE [Support].[SupportPlanTariffs];
            END

            IF NOT EXISTS (SELECT 1 FROM sys.schemas WHERE name = N'Support')
                EXEC(N'CREATE SCHEMA [Support]');

            IF OBJECT_ID(N'[Support].[SupportPlanTariffs]', N'U') IS NULL
            BEGIN
                CREATE TABLE [Support].[SupportPlanTariffs] (
                    [Id] bigint NOT NULL IDENTITY(1, 1),
                    [BusinessId] uniqueidentifier NOT NULL,
                    [DurationMonths] int NOT NULL,
                    [PriceToman] bigint NOT NULL,
                    [IsActive] bit NOT NULL,
                    [SortOrder] int NOT NULL,
                    [CreatedByUserId] nvarchar(50) NULL,
                    [CreatedDateTime] datetime2 NOT NULL,
                    [ModifiedByUserId] nvarchar(50) NULL,
                    [ModifiedDateTime] datetime2 NULL,
                    [IsDelete] bit NOT NULL,
                    CONSTRAINT [PK_SupportPlanTariffs] PRIMARY KEY ([Id]),
                    CONSTRAINT [AK_SupportPlanTariffs_BusinessId] UNIQUE ([BusinessId])
                );

                CREATE UNIQUE INDEX [IX_SupportPlanTariffs_DurationMonths]
                    ON [Support].[SupportPlanTariffs] ([DurationMonths]);
            END

            IF OBJECT_ID(N'[Support].[StudentSupportSubscriptions]', N'U') IS NULL
            BEGIN
                CREATE TABLE [Support].[StudentSupportSubscriptions] (
                    [Id] bigint NOT NULL IDENTITY(1, 1),
                    [BusinessId] uniqueidentifier NOT NULL,
                    [StudentUserId] bigint NOT NULL,
                    [AccessEndsAtUtc] datetime2 NULL,
                    [FreezeCountUsed] int NOT NULL,
                    [FrozenUntilUtc] datetime2 NULL,
                    [ActiveFreezeReason] nvarchar(500) NULL,
                    [RemainingSecondsWhileFrozen] int NULL,
                    [FrozenStartedAtUtc] datetime2 NULL,
                    [UpdatedAtUtc] datetime2 NOT NULL,
                    [CreatedByUserId] nvarchar(50) NULL,
                    [CreatedDateTime] datetime2 NOT NULL,
                    [ModifiedByUserId] nvarchar(50) NULL,
                    [ModifiedDateTime] datetime2 NULL,
                    [IsDelete] bit NOT NULL,
                    CONSTRAINT [PK_StudentSupportSubscriptions] PRIMARY KEY ([Id]),
                    CONSTRAINT [AK_StudentSupportSubscriptions_BusinessId] UNIQUE ([BusinessId])
                );

                CREATE UNIQUE INDEX [IX_StudentSupportSubscriptions_StudentUserId]
                    ON [Support].[StudentSupportSubscriptions] ([StudentUserId]);
            END

            IF OBJECT_ID(N'[Support].[StudentSupportFreezeRecords]', N'U') IS NULL
            BEGIN
                CREATE TABLE [Support].[StudentSupportFreezeRecords] (
                    [Id] bigint NOT NULL IDENTITY(1, 1),
                    [BusinessId] uniqueidentifier NOT NULL,
                    [StudentUserId] bigint NOT NULL,
                    [StudentSupportSubscriptionId] bigint NOT NULL,
                    [StartedAtUtc] datetime2 NOT NULL,
                    [EndsAtUtc] datetime2 NOT NULL,
                    [DurationDays] int NOT NULL,
                    [Reason] nvarchar(500) NOT NULL,
                    [CreatedByUserId] nvarchar(50) NULL,
                    [CreatedDateTime] datetime2 NOT NULL,
                    [ModifiedByUserId] nvarchar(50) NULL,
                    [ModifiedDateTime] datetime2 NULL,
                    [IsDelete] bit NOT NULL,
                    CONSTRAINT [PK_StudentSupportFreezeRecords] PRIMARY KEY ([Id]),
                    CONSTRAINT [AK_StudentSupportFreezeRecords_BusinessId] UNIQUE ([BusinessId]),
                    CONSTRAINT [FK_StudentSupportFreezeRecords_StudentSupportSubscriptions_StudentSupportSubscriptionId]
                        FOREIGN KEY ([StudentSupportSubscriptionId])
                        REFERENCES [Support].[StudentSupportSubscriptions] ([Id])
                        ON DELETE CASCADE
                );

                CREATE INDEX [IX_StudentSupportFreezeRecords_StudentUserId]
                    ON [Support].[StudentSupportFreezeRecords] ([StudentUserId]);
            END

            IF NOT EXISTS (SELECT 1 FROM [Support].[SupportPlanTariffs])
            BEGIN
                INSERT INTO [Support].[SupportPlanTariffs]
                    ([DurationMonths],[PriceToman],[IsActive],[SortOrder],[CreatedDateTime],[IsDelete],[BusinessId])
                VALUES
                    (1, 500000, 1, 1, SYSUTCDATETIME(), 0, NEWID()),
                    (3, 1200000, 1, 2, SYSUTCDATETIME(), 0, NEWID()),
                    (6, 2000000, 1, 3, SYSUTCDATETIME(), 0, NEWID());
            END
            """);
    }

    protected override void Down(MigrationBuilder migrationBuilder)
    {
        // Intentionally empty — reverting would re-break EF inserts.
    }
}
