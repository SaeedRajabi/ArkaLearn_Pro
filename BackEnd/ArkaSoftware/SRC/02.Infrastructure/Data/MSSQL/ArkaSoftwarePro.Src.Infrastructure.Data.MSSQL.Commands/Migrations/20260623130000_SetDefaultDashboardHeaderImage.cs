using Microsoft.EntityFrameworkCore.Migrations;
using Microsoft.EntityFrameworkCore.Infrastructure;

#nullable disable

using ArkaSoftwarePro.Src.Infrastructure.Data.MSSQL.Commands.Common;

namespace ArkaSoftwarePro.Src.Infrastructure.Data.MSSQL.Commands.Migrations
{
    [DbContext(typeof(ArkaSoftwareCommandDbContext))]
[Migration("20260623130000_SetDefaultDashboardHeaderImage")]
public partial class SetDefaultDashboardHeaderImage : Migration
    {
        private const string DefaultHeaderImageUrl = "/icons/Dashboard_Header.jpg";

        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql($"""
                UPDATE [Student].[Students]
                SET [HeaderImageUrl] = '{DefaultHeaderImageUrl}'
                WHERE [HeaderImageUrl] IS NULL OR LTRIM(RTRIM([HeaderImageUrl])) = '';

                UPDATE [Teacher].[Teachers]
                SET [HeaderImageUrl] = '{DefaultHeaderImageUrl}'
                WHERE [HeaderImageUrl] IS NULL OR LTRIM(RTRIM([HeaderImageUrl])) = '';
                """);
        }

        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql($"""
                UPDATE [Student].[Students]
                SET [HeaderImageUrl] = NULL
                WHERE [HeaderImageUrl] = '{DefaultHeaderImageUrl}';

                UPDATE [Teacher].[Teachers]
                SET [HeaderImageUrl] = NULL
                WHERE [HeaderImageUrl] = '{DefaultHeaderImageUrl}';
                """);
        }
    }
}
