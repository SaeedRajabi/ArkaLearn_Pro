using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;
using ArkaSoftwarePro.Src.Infrastructure.Data.MSSQL.Commands.Common;

#nullable disable

namespace ArkaSoftwarePro.Src.Infrastructure.Data.MSSQL.Commands.Migrations;

/// <summary>
/// Ensures SupportTickets has contact-form columns (RequesterEmail, reply metadata).
/// Idempotent for databases that missed the original AddSupportTicketContactFields migration.
/// </summary>
[DbContext(typeof(ArkaSoftwareCommandDbContext))]
[Migration("20260909120000_EnsureSupportTicketContactFields")]
public partial class EnsureSupportTicketContactFields : Migration
{
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.Sql("""
            IF OBJECT_ID(N'[dbo].[SupportTickets]', N'U') IS NOT NULL
            BEGIN
                IF COL_LENGTH('dbo.SupportTickets', 'RequesterEmail') IS NULL
                    ALTER TABLE [dbo].[SupportTickets] ADD [RequesterEmail] nvarchar(320) NOT NULL
                        CONSTRAINT [DF_SupportTickets_RequesterEmail] DEFAULT('');

                IF COL_LENGTH('dbo.SupportTickets', 'AdminReply') IS NULL
                    ALTER TABLE [dbo].[SupportTickets] ADD [AdminReply] NVARCHAR(MAX) NULL;

                IF COL_LENGTH('dbo.SupportTickets', 'RepliedAt') IS NULL
                    ALTER TABLE [dbo].[SupportTickets] ADD [RepliedAt] datetime2 NULL;

                IF COL_LENGTH('dbo.SupportTickets', 'RepliedByUserId') IS NULL
                    ALTER TABLE [dbo].[SupportTickets] ADD [RepliedByUserId] bigint NULL;
            END
            """);
    }

    protected override void Down(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.Sql("""
            IF OBJECT_ID(N'[dbo].[SupportTickets]', N'U') IS NOT NULL
            BEGIN
                IF COL_LENGTH('dbo.SupportTickets', 'RepliedByUserId') IS NOT NULL
                    ALTER TABLE [dbo].[SupportTickets] DROP COLUMN [RepliedByUserId];

                IF COL_LENGTH('dbo.SupportTickets', 'RepliedAt') IS NOT NULL
                    ALTER TABLE [dbo].[SupportTickets] DROP COLUMN [RepliedAt];

                IF COL_LENGTH('dbo.SupportTickets', 'AdminReply') IS NOT NULL
                    ALTER TABLE [dbo].[SupportTickets] DROP COLUMN [AdminReply];

                IF COL_LENGTH('dbo.SupportTickets', 'RequesterEmail') IS NOT NULL
                BEGIN
                    IF OBJECT_ID(N'[dbo].[DF_SupportTickets_RequesterEmail]', N'D') IS NOT NULL
                        ALTER TABLE [dbo].[SupportTickets] DROP CONSTRAINT [DF_SupportTickets_RequesterEmail];

                    ALTER TABLE [dbo].[SupportTickets] DROP COLUMN [RequesterEmail];
                END
            END
            """);
    }
}
