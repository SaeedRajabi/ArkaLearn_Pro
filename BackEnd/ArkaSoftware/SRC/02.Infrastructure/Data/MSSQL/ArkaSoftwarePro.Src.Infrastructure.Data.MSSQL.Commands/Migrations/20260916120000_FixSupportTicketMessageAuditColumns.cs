using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;
using ArkaSoftwarePro.Src.Infrastructure.Data.MSSQL.Commands.Common;

#nullable disable

namespace ArkaSoftwarePro.Src.Infrastructure.Data.MSSQL.Commands.Migrations;

/// <summary>
/// Aligns SupportTicketMessages audit columns with framework shadow properties (nvarchar user ids).
/// </summary>
[DbContext(typeof(ArkaSoftwareCommandDbContext))]
[Migration("20260916120000_FixSupportTicketMessageAuditColumns")]
public partial class FixSupportTicketMessageAuditColumns : Migration
{
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.Sql(@"
IF OBJECT_ID(N'[dbo].[SupportTicketMessages]', N'U') IS NOT NULL
BEGIN
    IF EXISTS (
        SELECT 1
        FROM sys.columns c
        INNER JOIN sys.types t ON c.user_type_id = t.user_type_id
        WHERE c.object_id = OBJECT_ID(N'[dbo].[SupportTicketMessages]')
          AND c.name = N'CreatedByUserId'
          AND t.name = N'bigint'
    )
    BEGIN
        ALTER TABLE [dbo].[SupportTicketMessages] ALTER COLUMN [CreatedByUserId] nvarchar(50) NULL;
    END

    IF EXISTS (
        SELECT 1
        FROM sys.columns c
        INNER JOIN sys.types t ON c.user_type_id = t.user_type_id
        WHERE c.object_id = OBJECT_ID(N'[dbo].[SupportTicketMessages]')
          AND c.name = N'ModifiedByUserId'
          AND t.name = N'bigint'
    )
    BEGIN
        ALTER TABLE [dbo].[SupportTicketMessages] ALTER COLUMN [ModifiedByUserId] nvarchar(50) NULL;
    END
END
");
    }

    protected override void Down(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.Sql(@"
IF OBJECT_ID(N'[dbo].[SupportTicketMessages]', N'U') IS NOT NULL
BEGIN
    IF EXISTS (
        SELECT 1
        FROM sys.columns c
        INNER JOIN sys.types t ON c.user_type_id = t.user_type_id
        WHERE c.object_id = OBJECT_ID(N'[dbo].[SupportTicketMessages]')
          AND c.name = N'CreatedByUserId'
          AND t.name IN (N'nvarchar', N'varchar')
    )
    BEGIN
        ALTER TABLE [dbo].[SupportTicketMessages] ALTER COLUMN [CreatedByUserId] bigint NULL;
    END

    IF EXISTS (
        SELECT 1
        FROM sys.columns c
        INNER JOIN sys.types t ON c.user_type_id = t.user_type_id
        WHERE c.object_id = OBJECT_ID(N'[dbo].[SupportTicketMessages]')
          AND c.name = N'ModifiedByUserId'
          AND t.name IN (N'nvarchar', N'varchar')
    )
    BEGIN
        ALTER TABLE [dbo].[SupportTicketMessages] ALTER COLUMN [ModifiedByUserId] bigint NULL;
    END
END
");
    }
}
