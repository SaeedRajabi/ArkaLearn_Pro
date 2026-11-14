using Microsoft.EntityFrameworkCore.Migrations;
using Microsoft.EntityFrameworkCore.Infrastructure;

#nullable disable

using ArkaSoftwarePro.Src.Infrastructure.Data.MSSQL.Commands.Common;

namespace ArkaSoftwarePro.Src.Infrastructure.Data.MSSQL.Commands.Migrations;

[DbContext(typeof(ArkaSoftwareCommandDbContext))]
[Migration("20260801120000_AddStudentSupportSubscription")]
public partial class AddStudentSupportSubscription : Migration
{
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.CreateTable(
            name: "SupportPlanTariffs",
            schema: "Support",
            columns: table => new
            {
                Id = table.Column<long>(type: "bigint", nullable: false)
                    .Annotation("SqlServer:Identity", "1, 1"),
                BusinessId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                DurationMonths = table.Column<int>(type: "int", nullable: false),
                PriceToman = table.Column<long>(type: "bigint", nullable: false),
                IsActive = table.Column<bool>(type: "bit", nullable: false),
                SortOrder = table.Column<int>(type: "int", nullable: false),
                CreatedByUserId = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: true),
                CreatedDateTime = table.Column<DateTime>(type: "datetime2", nullable: false),
                ModifiedByUserId = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: true),
                ModifiedDateTime = table.Column<DateTime>(type: "datetime2", nullable: true),
                IsDelete = table.Column<bool>(type: "bit", nullable: false),
            },
            constraints: table =>
            {
                table.PrimaryKey("PK_SupportPlanTariffs", x => x.Id);
                table.UniqueConstraint("AK_SupportPlanTariffs_BusinessId", x => x.BusinessId);
            });

        migrationBuilder.CreateTable(
            name: "StudentSupportSubscriptions",
            schema: "Support",
            columns: table => new
            {
                Id = table.Column<long>(type: "bigint", nullable: false)
                    .Annotation("SqlServer:Identity", "1, 1"),
                BusinessId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                StudentUserId = table.Column<long>(type: "bigint", nullable: false),
                AccessEndsAtUtc = table.Column<DateTime>(type: "datetime2", nullable: true),
                FreezeCountUsed = table.Column<int>(type: "int", nullable: false),
                FrozenUntilUtc = table.Column<DateTime>(type: "datetime2", nullable: true),
                ActiveFreezeReason = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: true),
                RemainingSecondsWhileFrozen = table.Column<int>(type: "int", nullable: true),
                FrozenStartedAtUtc = table.Column<DateTime>(type: "datetime2", nullable: true),
                UpdatedAtUtc = table.Column<DateTime>(type: "datetime2", nullable: false),
                CreatedByUserId = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: true),
                CreatedDateTime = table.Column<DateTime>(type: "datetime2", nullable: false),
                ModifiedByUserId = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: true),
                ModifiedDateTime = table.Column<DateTime>(type: "datetime2", nullable: true),
                IsDelete = table.Column<bool>(type: "bit", nullable: false),
            },
            constraints: table =>
            {
                table.PrimaryKey("PK_StudentSupportSubscriptions", x => x.Id);
                table.UniqueConstraint("AK_StudentSupportSubscriptions_BusinessId", x => x.BusinessId);
            });

        migrationBuilder.CreateTable(
            name: "StudentSupportFreezeRecords",
            schema: "Support",
            columns: table => new
            {
                Id = table.Column<long>(type: "bigint", nullable: false)
                    .Annotation("SqlServer:Identity", "1, 1"),
                BusinessId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                StudentUserId = table.Column<long>(type: "bigint", nullable: false),
                StudentSupportSubscriptionId = table.Column<long>(type: "bigint", nullable: false),
                StartedAtUtc = table.Column<DateTime>(type: "datetime2", nullable: false),
                EndsAtUtc = table.Column<DateTime>(type: "datetime2", nullable: false),
                DurationDays = table.Column<int>(type: "int", nullable: false),
                Reason = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: false),
                CreatedByUserId = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: true),
                CreatedDateTime = table.Column<DateTime>(type: "datetime2", nullable: false),
                ModifiedByUserId = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: true),
                ModifiedDateTime = table.Column<DateTime>(type: "datetime2", nullable: true),
                IsDelete = table.Column<bool>(type: "bit", nullable: false),
            },
            constraints: table =>
            {
                table.PrimaryKey("PK_StudentSupportFreezeRecords", x => x.Id);
                table.UniqueConstraint("AK_StudentSupportFreezeRecords_BusinessId", x => x.BusinessId);
                table.ForeignKey(
                    name: "FK_StudentSupportFreezeRecords_StudentSupportSubscriptions_StudentSupportSubscriptionId",
                    column: x => x.StudentSupportSubscriptionId,
                    principalSchema: "Support",
                    principalTable: "StudentSupportSubscriptions",
                    principalColumn: "Id",
                    onDelete: ReferentialAction.Cascade);
            });

        migrationBuilder.CreateIndex(
            name: "IX_StudentSupportSubscriptions_StudentUserId",
            schema: "Support",
            table: "StudentSupportSubscriptions",
            column: "StudentUserId",
            unique: true);

        migrationBuilder.CreateIndex(
            name: "IX_SupportPlanTariffs_DurationMonths",
            schema: "Support",
            table: "SupportPlanTariffs",
            column: "DurationMonths",
            unique: true);

        migrationBuilder.CreateIndex(
            name: "IX_StudentSupportFreezeRecords_StudentUserId",
            schema: "Support",
            table: "StudentSupportFreezeRecords",
            column: "StudentUserId");

        migrationBuilder.Sql("""
            IF NOT EXISTS (SELECT 1 FROM [Support].[SupportPlanTariffs])
            BEGIN
                INSERT INTO [Support].[SupportPlanTariffs]
                    ([DurationMonths],[PriceToman],[IsActive],[SortOrder],[CreatedDateTime],[IsDelete],[BusinessId])
                VALUES
                    (1, 500000, 1, 1, SYSUTCDATETIME(), 0, NEWID()),
                    (3, 1200000, 1, 2, SYSUTCDATETIME(), 0, NEWID()),
                    (6, 2000000, 1, 3, SYSUTCDATETIME(), 0, NEWID());
            END
            """);
    }

    protected override void Down(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.DropTable(name: "StudentSupportFreezeRecords", schema: "Support");
        migrationBuilder.DropTable(name: "StudentSupportSubscriptions", schema: "Support");
        migrationBuilder.DropTable(name: "SupportPlanTariffs", schema: "Support");
    }
}
