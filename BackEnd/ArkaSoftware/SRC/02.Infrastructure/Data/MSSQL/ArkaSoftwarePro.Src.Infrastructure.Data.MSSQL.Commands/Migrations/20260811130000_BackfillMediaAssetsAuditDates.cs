using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;
using ArkaSoftwarePro.Src.Infrastructure.Data.MSSQL.Commands.Common;

#nullable disable

namespace ArkaSoftwarePro.Src.Infrastructure.Data.MSSQL.Commands.Migrations;

[DbContext(typeof(ArkaSoftwareCommandDbContext))]
[Migration("20260811130000_BackfillMediaAssetsAuditDates")]
public partial class BackfillMediaAssetsAuditDates : Migration
{
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.Sql("""
            IF OBJECT_ID(N'[Media].[MediaAssets]', N'U') IS NOT NULL
            BEGIN
                UPDATE [Media].[MediaAssets]
                SET [CreatedDateTime] = SYSUTCDATETIME()
                WHERE [CreatedDateTime] IS NULL;

                UPDATE [Media].[MediaAssets]
                SET [ModifiedDateTime] = COALESCE([ModifiedDateTime], [CreatedDateTime], SYSUTCDATETIME())
                WHERE [ModifiedDateTime] IS NULL;
            END
            """);
    }

    protected override void Down(MigrationBuilder migrationBuilder)
    {
        // Data backfill — no rollback.
    }
}
