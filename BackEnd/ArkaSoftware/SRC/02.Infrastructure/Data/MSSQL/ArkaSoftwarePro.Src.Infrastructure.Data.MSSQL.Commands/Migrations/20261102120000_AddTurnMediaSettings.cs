using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;
using ArkaSoftwarePro.Src.Infrastructure.Data.MSSQL.Commands.Common;

#nullable disable

namespace ArkaSoftwarePro.Src.Infrastructure.Data.MSSQL.Commands.Migrations
{
    [DbContext(typeof(ArkaSoftwareCommandDbContext))]
    [Migration("20261102120000_AddTurnMediaSettings")]
    public partial class AddTurnMediaSettings : Migration
    {
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql("""
                IF OBJECT_ID(N'Website.LiveMediaTransportSettings', N'U') IS NOT NULL
                AND NOT EXISTS (
                    SELECT 1 FROM sys.columns
                    WHERE object_id = OBJECT_ID(N'Website.LiveMediaTransportSettings') AND name = N'TurnUrl'
                )
                BEGIN
                    ALTER TABLE Website.LiveMediaTransportSettings ADD TurnUrl NVARCHAR(512) NULL;
                END
                """);

            migrationBuilder.Sql("""
                IF OBJECT_ID(N'Website.LiveMediaTransportSettings', N'U') IS NOT NULL
                AND NOT EXISTS (
                    SELECT 1 FROM sys.columns
                    WHERE object_id = OBJECT_ID(N'Website.LiveMediaTransportSettings') AND name = N'TurnUsername'
                )
                BEGIN
                    ALTER TABLE Website.LiveMediaTransportSettings ADD TurnUsername NVARCHAR(128) NULL;
                END
                """);

            migrationBuilder.Sql("""
                IF OBJECT_ID(N'Website.LiveMediaTransportSettings', N'U') IS NOT NULL
                AND NOT EXISTS (
                    SELECT 1 FROM sys.columns
                    WHERE object_id = OBJECT_ID(N'Website.LiveMediaTransportSettings') AND name = N'TurnPasswordEncrypted'
                )
                BEGIN
                    ALTER TABLE Website.LiveMediaTransportSettings ADD TurnPasswordEncrypted NVARCHAR(512) NULL;
                END
                """);

            migrationBuilder.Sql("""
                IF OBJECT_ID(N'Website.LiveMediaTransportSettings', N'U') IS NOT NULL
                AND NOT EXISTS (
                    SELECT 1 FROM sys.columns
                    WHERE object_id = OBJECT_ID(N'Website.LiveMediaTransportSettings') AND name = N'StunUrls'
                )
                BEGIN
                    ALTER TABLE Website.LiveMediaTransportSettings ADD StunUrls NVARCHAR(512) NULL;
                END
                """);
        }

        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql("""
                IF OBJECT_ID(N'Website.LiveMediaTransportSettings', N'U') IS NOT NULL
                AND EXISTS (
                    SELECT 1 FROM sys.columns
                    WHERE object_id = OBJECT_ID(N'Website.LiveMediaTransportSettings') AND name = N'StunUrls'
                )
                BEGIN
                    ALTER TABLE Website.LiveMediaTransportSettings DROP COLUMN StunUrls;
                END
                """);

            migrationBuilder.Sql("""
                IF OBJECT_ID(N'Website.LiveMediaTransportSettings', N'U') IS NOT NULL
                AND EXISTS (
                    SELECT 1 FROM sys.columns
                    WHERE object_id = OBJECT_ID(N'Website.LiveMediaTransportSettings') AND name = N'TurnPasswordEncrypted'
                )
                BEGIN
                    ALTER TABLE Website.LiveMediaTransportSettings DROP COLUMN TurnPasswordEncrypted;
                END
                """);

            migrationBuilder.Sql("""
                IF OBJECT_ID(N'Website.LiveMediaTransportSettings', N'U') IS NOT NULL
                AND EXISTS (
                    SELECT 1 FROM sys.columns
                    WHERE object_id = OBJECT_ID(N'Website.LiveMediaTransportSettings') AND name = N'TurnUsername'
                )
                BEGIN
                    ALTER TABLE Website.LiveMediaTransportSettings DROP COLUMN TurnUsername;
                END
                """);

            migrationBuilder.Sql("""
                IF OBJECT_ID(N'Website.LiveMediaTransportSettings', N'U') IS NOT NULL
                AND EXISTS (
                    SELECT 1 FROM sys.columns
                    WHERE object_id = OBJECT_ID(N'Website.LiveMediaTransportSettings') AND name = N'TurnUrl'
                )
                BEGIN
                    ALTER TABLE Website.LiveMediaTransportSettings DROP COLUMN TurnUrl;
                END
                """);
        }
    }
}
