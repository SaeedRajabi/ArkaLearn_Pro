using Microsoft.EntityFrameworkCore.Migrations;
using Microsoft.EntityFrameworkCore.Infrastructure;

#nullable disable

using ArkaSoftwarePro.Src.Infrastructure.Data.MSSQL.Commands.Common;

namespace ArkaSoftwarePro.Src.Infrastructure.Data.MSSQL.Commands.Migrations;

[DbContext(typeof(ArkaSoftwareCommandDbContext))]
[Migration("20260726140000_AddEducationPlanInstallments")]
public partial class AddEducationPlanInstallments : Migration
{
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.AddColumn<byte>(
            name: "PaymentType",
            schema: "Education",
            table: "EducationPlans",
            type: "tinyint",
            nullable: false,
            defaultValue: (byte)0);

        migrationBuilder.AddColumn<decimal>(
            name: "BaseTotalCostToman",
            schema: "Education",
            table: "EducationPlans",
            type: "DECIMAL(18,0)",
            nullable: false,
            defaultValue: 0m);

        migrationBuilder.AddColumn<decimal>(
            name: "FinalTotalCostToman",
            schema: "Education",
            table: "EducationPlans",
            type: "DECIMAL(18,0)",
            nullable: false,
            defaultValue: 0m);

        migrationBuilder.Sql("""
            UPDATE [Education].[EducationPlans]
            SET [BaseTotalCostToman] = ISNULL([Amount], 0),
                [FinalTotalCostToman] = ISNULL([Amount], 0)
            WHERE [BaseTotalCostToman] = 0;
            """);

        migrationBuilder.CreateTable(
            name: "EducationPlanInstallments",
            schema: "Education",
            columns: table => new
            {
                Id = table.Column<long>(type: "bigint", nullable: false)
                    .Annotation("SqlServer:Identity", "1, 1"),
                EducationPlanId = table.Column<long>(type: "bigint", nullable: false),
                InstallmentNumber = table.Column<int>(type: "int", nullable: false),
                DueDateUtc = table.Column<DateTime>(type: "datetime2", nullable: false),
                AmountToman = table.Column<decimal>(type: "DECIMAL(18,0)", nullable: false),
                IsPaid = table.Column<bool>(type: "bit", nullable: false),
                PaidAtUtc = table.Column<DateTime>(type: "datetime2", nullable: true),
                PaymentReference = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: true),
                ReminderSentAtUtc = table.Column<DateTime>(type: "datetime2", nullable: true),
                CreatedByUserId = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: true),
                CreatedDateTime = table.Column<DateTime>(type: "datetime2", nullable: true),
                ModifiedByUserId = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: true),
                ModifiedDateTime = table.Column<DateTime>(type: "datetime2", nullable: true),
                IsDelete = table.Column<bool>(type: "bit", nullable: false),
                BusinessId = table.Column<Guid>(type: "uniqueidentifier", nullable: false)
            },
            constraints: table =>
            {
                table.PrimaryKey("PK_EducationPlanInstallments", x => x.Id);
                table.ForeignKey(
                    name: "FK_EducationPlanInstallments_EducationPlans_EducationPlanId",
                    column: x => x.EducationPlanId,
                    principalSchema: "Education",
                    principalTable: "EducationPlans",
                    principalColumn: "Id",
                    onDelete: ReferentialAction.Cascade);
            });

        migrationBuilder.CreateIndex(
            name: "IX_EducationPlanInstallments_DueDateUtc",
            schema: "Education",
            table: "EducationPlanInstallments",
            column: "DueDateUtc");

        migrationBuilder.CreateIndex(
            name: "IX_EducationPlanInstallments_EducationPlanId_InstallmentNumber",
            schema: "Education",
            table: "EducationPlanInstallments",
            columns: new[] { "EducationPlanId", "InstallmentNumber" },
            unique: true);
    }

    protected override void Down(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.DropTable(name: "EducationPlanInstallments", schema: "Education");
        migrationBuilder.DropColumn(name: "FinalTotalCostToman", schema: "Education", table: "EducationPlans");
        migrationBuilder.DropColumn(name: "BaseTotalCostToman", schema: "Education", table: "EducationPlans");
        migrationBuilder.DropColumn(name: "PaymentType", schema: "Education", table: "EducationPlans");
    }
}
