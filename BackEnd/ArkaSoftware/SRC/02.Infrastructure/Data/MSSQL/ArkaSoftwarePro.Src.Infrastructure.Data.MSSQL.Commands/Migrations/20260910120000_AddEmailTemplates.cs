using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;
using ArkaSoftwarePro.Src.Infrastructure.Data.MSSQL.Commands.Common;

#nullable disable

namespace ArkaSoftwarePro.Src.Infrastructure.Data.MSSQL.Commands.Migrations;

[DbContext(typeof(ArkaSoftwareCommandDbContext))]
[Migration("20260910120000_AddEmailTemplates")]
public partial class AddEmailTemplates : Migration
{
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.Sql("""
            IF SCHEMA_ID(N'Website') IS NULL
                EXEC(N'CREATE SCHEMA [Website]');

            IF OBJECT_ID(N'[Website].[EmailTemplates]', N'U') IS NULL
            BEGIN
                CREATE TABLE [Website].[EmailTemplates] (
                    [Id] bigint NOT NULL IDENTITY,
                    [TemplateKey] NVARCHAR(100) NOT NULL,
                    [DisplayName] NVARCHAR(200) NOT NULL,
                    [Description] NVARCHAR(1000) NOT NULL CONSTRAINT [DF_EmailTemplates_Description] DEFAULT(N''),
                    [Subject] NVARCHAR(500) NOT NULL,
                    [BodyHtml] NVARCHAR(MAX) NOT NULL,
                    [IsEnabled] bit NOT NULL CONSTRAINT [DF_EmailTemplates_IsEnabled] DEFAULT(1),
                    [CreatedByUserId] nvarchar(50) NULL,
                    [CreatedDateTime] datetime2 NULL,
                    [ModifiedByUserId] nvarchar(50) NULL,
                    [ModifiedDateTime] datetime2 NULL,
                    [IsDelete] bit NOT NULL CONSTRAINT [DF_EmailTemplates_IsDelete] DEFAULT(0),
                    [BusinessId] uniqueidentifier NOT NULL CONSTRAINT [DF_EmailTemplates_BusinessId] DEFAULT NEWID(),
                    CONSTRAINT [PK_EmailTemplates] PRIMARY KEY ([Id])
                );
                CREATE UNIQUE INDEX [IX_EmailTemplates_TemplateKey] ON [Website].[EmailTemplates] ([TemplateKey]);
            END
            """);
    }

    protected override void Down(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.Sql("""
            IF OBJECT_ID(N'[Website].[EmailTemplates]', N'U') IS NOT NULL
                DROP TABLE [Website].[EmailTemplates];
            """);
    }
}
