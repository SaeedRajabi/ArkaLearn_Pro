using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;
using ArkaSoftwarePro.Src.Infrastructure.Data.MSSQL.Commands.Common;

#nullable disable

namespace ArkaSoftwarePro.Src.Infrastructure.Data.MSSQL.Commands.Migrations;

[DbContext(typeof(ArkaSoftwareCommandDbContext))]
[Migration("20260916120000_AddPlatformSupportTopics")]
public partial class AddPlatformSupportTopics : Migration
{
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.Sql("""
            IF SCHEMA_ID(N'Website') IS NULL
                EXEC(N'CREATE SCHEMA [Website]');

            IF OBJECT_ID(N'[Website].[PlatformSupportTopics]', N'U') IS NULL
            BEGIN
                CREATE TABLE [Website].[PlatformSupportTopics] (
                    [Id] bigint NOT NULL IDENTITY,
                    [Title] NVARCHAR(300) NOT NULL,
                    [Summary] NVARCHAR(500) NOT NULL CONSTRAINT [DF_PlatformSupportTopics_Summary] DEFAULT(N''),
                    [ContentHtml] NVARCHAR(MAX) NOT NULL,
                    [Department] NVARCHAR(50) NULL,
                    [SortOrder] int NOT NULL CONSTRAINT [DF_PlatformSupportTopics_SortOrder] DEFAULT(0),
                    [IsPublished] bit NOT NULL CONSTRAINT [DF_PlatformSupportTopics_IsPublished] DEFAULT(1),
                    [CreatedByUserId] nvarchar(50) NULL,
                    [CreatedDateTime] datetime2 NULL,
                    [ModifiedByUserId] nvarchar(50) NULL,
                    [ModifiedDateTime] datetime2 NULL,
                    [IsDelete] bit NOT NULL CONSTRAINT [DF_PlatformSupportTopics_IsDelete] DEFAULT(0),
                    [BusinessId] uniqueidentifier NOT NULL CONSTRAINT [DF_PlatformSupportTopics_BusinessId] DEFAULT NEWID(),
                    CONSTRAINT [PK_PlatformSupportTopics] PRIMARY KEY ([Id])
                );
            END
            """);
    }

    protected override void Down(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.Sql("""
            IF OBJECT_ID(N'[Website].[PlatformSupportTopics]', N'U') IS NOT NULL
                DROP TABLE [Website].[PlatformSupportTopics];
            """);
    }
}
