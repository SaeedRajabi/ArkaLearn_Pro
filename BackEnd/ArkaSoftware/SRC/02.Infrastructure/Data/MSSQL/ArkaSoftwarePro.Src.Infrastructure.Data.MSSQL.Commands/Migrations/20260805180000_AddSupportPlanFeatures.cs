using Microsoft.EntityFrameworkCore.Migrations;
using Microsoft.EntityFrameworkCore.Infrastructure;
using ArkaSoftwarePro.Src.Infrastructure.Data.MSSQL.Commands.Common;

#nullable disable

namespace ArkaSoftwarePro.Src.Infrastructure.Data.MSSQL.Commands.Migrations;

[DbContext(typeof(ArkaSoftwareCommandDbContext))]
[Migration("20260805180000_AddSupportPlanFeatures")]
public partial class AddSupportPlanFeatures : Migration
{
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.CreateTable(
            name: "SupportPlanTariffFeatures",
            schema: "Support",
            columns: table => new
            {
                Id = table.Column<long>(type: "bigint", nullable: false)
                    .Annotation("SqlServer:Identity", "1, 1"),
                BusinessId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                SupportPlanTariffId = table.Column<long>(type: "bigint", nullable: false),
                FeatureCode = table.Column<string>(type: "nvarchar(64)", maxLength: 64, nullable: false),
                IsOffered = table.Column<bool>(type: "bit", nullable: false),
                AddonPriceToman = table.Column<long>(type: "bigint", nullable: false),
                SortOrder = table.Column<int>(type: "int", nullable: false),
                CreatedByUserId = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: true),
                CreatedDateTime = table.Column<DateTime>(type: "datetime2", nullable: false),
                ModifiedByUserId = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: true),
                ModifiedDateTime = table.Column<DateTime>(type: "datetime2", nullable: true),
                IsDelete = table.Column<bool>(type: "bit", nullable: false),
            },
            constraints: table =>
            {
                table.PrimaryKey("PK_SupportPlanTariffFeatures", x => x.Id);
                table.UniqueConstraint("AK_SupportPlanTariffFeatures_BusinessId", x => x.BusinessId);
                table.ForeignKey(
                    name: "FK_SupportPlanTariffFeatures_SupportPlanTariffs_SupportPlanTariffId",
                    column: x => x.SupportPlanTariffId,
                    principalSchema: "Support",
                    principalTable: "SupportPlanTariffs",
                    principalColumn: "Id",
                    onDelete: ReferentialAction.Cascade);
            });

        migrationBuilder.CreateTable(
            name: "StudentSupportFeatureGrants",
            schema: "Support",
            columns: table => new
            {
                Id = table.Column<long>(type: "bigint", nullable: false)
                    .Annotation("SqlServer:Identity", "1, 1"),
                BusinessId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                StudentSupportSubscriptionId = table.Column<long>(type: "bigint", nullable: false),
                FeatureCode = table.Column<string>(type: "nvarchar(64)", maxLength: 64, nullable: false),
                GrantedAtUtc = table.Column<DateTime>(type: "datetime2", nullable: false),
                ExpiresAtUtc = table.Column<DateTime>(type: "datetime2", nullable: false),
                CreatedByUserId = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: true),
                CreatedDateTime = table.Column<DateTime>(type: "datetime2", nullable: false),
                ModifiedByUserId = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: true),
                ModifiedDateTime = table.Column<DateTime>(type: "datetime2", nullable: true),
                IsDelete = table.Column<bool>(type: "bit", nullable: false),
            },
            constraints: table =>
            {
                table.PrimaryKey("PK_StudentSupportFeatureGrants", x => x.Id);
                table.UniqueConstraint("AK_StudentSupportFeatureGrants_BusinessId", x => x.BusinessId);
                table.ForeignKey(
                    name: "FK_StudentSupportFeatureGrants_StudentSupportSubscriptions_StudentSupportSubscriptionId",
                    column: x => x.StudentSupportSubscriptionId,
                    principalSchema: "Support",
                    principalTable: "StudentSupportSubscriptions",
                    principalColumn: "Id",
                    onDelete: ReferentialAction.Cascade);
            });

        migrationBuilder.CreateTable(
            name: "SupportPlanPendingPurchases",
            schema: "Support",
            columns: table => new
            {
                Id = table.Column<long>(type: "bigint", nullable: false)
                    .Annotation("SqlServer:Identity", "1, 1"),
                BusinessId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                StudentUserId = table.Column<long>(type: "bigint", nullable: false),
                TariffId = table.Column<long>(type: "bigint", nullable: false),
                FeatureCodesCsv = table.Column<string>(type: "nvarchar(1000)", maxLength: 1000, nullable: false),
                TotalAmountToman = table.Column<long>(type: "bigint", nullable: false),
                CreatedAtUtc = table.Column<DateTime>(type: "datetime2", nullable: false),
                ExpiresAtUtc = table.Column<DateTime>(type: "datetime2", nullable: false),
                IsConsumed = table.Column<bool>(type: "bit", nullable: false),
                CreatedByUserId = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: true),
                CreatedDateTime = table.Column<DateTime>(type: "datetime2", nullable: false),
                ModifiedByUserId = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: true),
                ModifiedDateTime = table.Column<DateTime>(type: "datetime2", nullable: true),
                IsDelete = table.Column<bool>(type: "bit", nullable: false),
            },
            constraints: table =>
            {
                table.PrimaryKey("PK_SupportPlanPendingPurchases", x => x.Id);
                table.UniqueConstraint("AK_SupportPlanPendingPurchases_BusinessId", x => x.BusinessId);
            });

        migrationBuilder.CreateIndex(
            name: "IX_SupportPlanTariffFeatures_SupportPlanTariffId_FeatureCode",
            schema: "Support",
            table: "SupportPlanTariffFeatures",
            columns: new[] { "SupportPlanTariffId", "FeatureCode" },
            unique: true);

        migrationBuilder.CreateIndex(
            name: "IX_StudentSupportFeatureGrants_StudentSupportSubscriptionId_FeatureCode",
            schema: "Support",
            table: "StudentSupportFeatureGrants",
            columns: new[] { "StudentSupportSubscriptionId", "FeatureCode" },
            unique: true);

        migrationBuilder.CreateIndex(
            name: "IX_SupportPlanPendingPurchases_StudentUserId_TariffId_IsConsumed",
            schema: "Support",
            table: "SupportPlanPendingPurchases",
            columns: new[] { "StudentUserId", "TariffId", "IsConsumed" });
    }

    protected override void Down(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.DropTable(name: "SupportPlanTariffFeatures", schema: "Support");
        migrationBuilder.DropTable(name: "StudentSupportFeatureGrants", schema: "Support");
        migrationBuilder.DropTable(name: "SupportPlanPendingPurchases", schema: "Support");
    }
}
