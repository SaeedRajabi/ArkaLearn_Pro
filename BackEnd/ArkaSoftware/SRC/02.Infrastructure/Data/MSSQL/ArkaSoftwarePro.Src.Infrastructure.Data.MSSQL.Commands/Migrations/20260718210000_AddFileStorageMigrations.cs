using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;
using ArkaSoftwarePro.Src.Infrastructure.Data.MSSQL.Commands.Common;

#nullable disable

namespace ArkaSoftwarePro.Src.Infrastructure.Data.MSSQL.Commands.Migrations;

[DbContext(typeof(ArkaSoftwareCommandDbContext))]
[Migration("20260718210000_AddFileStorageMigrations")]
public partial class AddFileStorageMigrations : Migration
{
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.Sql("""
            IF NOT EXISTS (SELECT 1 FROM sys.schemas WHERE name = N'Storage')
                EXEC(N'CREATE SCHEMA [Storage]');
            """);

        migrationBuilder.Sql("""
            IF OBJECT_ID(N'[Storage].[FileStorageMigrations]', N'U') IS NULL
            BEGIN
                CREATE TABLE [Storage].[FileStorageMigrations]
                (
                    [Id] bigint NOT NULL IDENTITY(1,1),
                    [SourcePath] nvarchar(1000) NOT NULL,
                    [ObjectKey] nvarchar(1000) NOT NULL,
                    [AccessTier] nvarchar(32) NOT NULL,
                    [Status] nvarchar(32) NOT NULL,
                    [Bytes] bigint NOT NULL CONSTRAINT [DF_FileStorageMigrations_Bytes] DEFAULT (0),
                    [Error] nvarchar(2000) NULL,
                    [CompletedAtUtc] datetime2 NULL,
                    [CreatedAtUtc] datetime2 NOT NULL,
                    [CreatedByUserId] nvarchar(50) NULL,
                    [CreatedDateTime] datetime2 NULL,
                    [ModifiedByUserId] nvarchar(50) NULL,
                    [ModifiedDateTime] datetime2 NULL,
                    [IsDelete] bit NOT NULL CONSTRAINT [DF_FileStorageMigrations_IsDelete] DEFAULT (0),
                    [BusinessId] uniqueidentifier NOT NULL,
                    CONSTRAINT [PK_FileStorageMigrations] PRIMARY KEY ([Id])
                );
                CREATE UNIQUE INDEX [IX_FileStorageMigrations_SourcePath]
                    ON [Storage].[FileStorageMigrations]([SourcePath]);
                CREATE INDEX [IX_FileStorageMigrations_Status]
                    ON [Storage].[FileStorageMigrations]([Status]);
                CREATE INDEX [IX_FileStorageMigrations_ObjectKey]
                    ON [Storage].[FileStorageMigrations]([ObjectKey]);
            END
            """);
    }

    protected override void Down(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.Sql("""
            IF OBJECT_ID(N'[Storage].[FileStorageMigrations]', N'U') IS NOT NULL
                DROP TABLE [Storage].[FileStorageMigrations];
            """);
    }
}
