using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;
using ArkaSoftwarePro.Src.Infrastructure.Data.MSSQL.Commands.Common;

#nullable disable

namespace ArkaSoftwarePro.Src.Infrastructure.Data.MSSQL.Commands.Migrations
{
    /// <summary>
    /// Aligns Teacher marketplace tables with IAuditableEntity shadow columns
    /// (CreatedByUserId, CreatedDateTime, ModifiedByUserId, ModifiedDateTime).
    /// Safe when tables were created with the incorrect CreateAt column.
    /// </summary>
    [DbContext(typeof(ArkaSoftwareCommandDbContext))]
    [Migration("20260616120001_FixTeacherMarketplaceAuditColumns")]
    public partial class FixTeacherMarketplaceAuditColumns : Migration
    {
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            FixAuditColumns(migrationBuilder, "TeachingCategories");
            FixAuditColumns(migrationBuilder, "PromotionalVideos");
            FixAuditColumns(migrationBuilder, "Books");
            FixAuditColumns(migrationBuilder, "PortfolioArticles");
        }

        protected override void Down(MigrationBuilder migrationBuilder)
        {
            // Intentionally empty — reverting would re-break EF mappings.
        }

        private static void FixAuditColumns(MigrationBuilder migrationBuilder, string tableName)
        {
            migrationBuilder.Sql($"""
                IF OBJECT_ID(N'[Teacher].[{tableName}]', N'U') IS NOT NULL
                BEGIN
                    IF COL_LENGTH('Teacher.{tableName}', 'CreatedByUserId') IS NULL
                        ALTER TABLE [Teacher].[{tableName}] ADD [CreatedByUserId] nvarchar(50) NULL;

                    IF COL_LENGTH('Teacher.{tableName}', 'CreatedDateTime') IS NULL
                        ALTER TABLE [Teacher].[{tableName}] ADD [CreatedDateTime] datetime2 NULL;

                    IF COL_LENGTH('Teacher.{tableName}', 'ModifiedByUserId') IS NULL
                        ALTER TABLE [Teacher].[{tableName}] ADD [ModifiedByUserId] nvarchar(50) NULL;

                    IF COL_LENGTH('Teacher.{tableName}', 'ModifiedDateTime') IS NULL
                        ALTER TABLE [Teacher].[{tableName}] ADD [ModifiedDateTime] datetime2 NULL;

                    IF COL_LENGTH('Teacher.{tableName}', 'CreateAt') IS NOT NULL
                    BEGIN
                        EXEC(N'UPDATE [Teacher].[{tableName}] SET [CreatedDateTime] = [CreateAt] WHERE [CreatedDateTime] IS NULL');
                        EXEC(N'ALTER TABLE [Teacher].[{tableName}] DROP COLUMN [CreateAt]');
                    END
                END
                """);
        }
    }
}
