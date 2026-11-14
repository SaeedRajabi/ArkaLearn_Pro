using Microsoft.EntityFrameworkCore.Migrations;
using Microsoft.EntityFrameworkCore.Infrastructure;
using ArkaSoftwarePro.Src.Infrastructure.Data.MSSQL.Commands.Common;

#nullable disable

namespace ArkaSoftwarePro.Src.Infrastructure.Data.MSSQL.Commands.Migrations;

[DbContext(typeof(ArkaSoftwareCommandDbContext))]
[Migration("20261022130000_ExtendDiscountCodesForAdminScopes")]
public partial class ExtendDiscountCodesForAdminScopes : Migration
{
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.AlterColumn<string>(
            name: "Discount_Code",
            schema: "Basket",
            table: "DiscountCodes",
            type: "VARCHAR(32)",
            maxLength: 32,
            nullable: true,
            oldClrType: typeof(string),
            oldType: "VARCHAR(10)",
            oldMaxLength: 10,
            oldNullable: true);

        migrationBuilder.AddColumn<byte>(
            name: "ScopeType",
            schema: "Basket",
            table: "DiscountCodes",
            type: "tinyint",
            nullable: false,
            defaultValue: (byte)0);

        migrationBuilder.AddColumn<long>(
            name: "TeacherId",
            schema: "Basket",
            table: "DiscountCodes",
            type: "bigint",
            nullable: true);

        migrationBuilder.AddColumn<long>(
            name: "StudentUserId",
            schema: "Basket",
            table: "DiscountCodes",
            type: "bigint",
            nullable: true);

        migrationBuilder.AddColumn<string>(
            name: "Title",
            schema: "Basket",
            table: "DiscountCodes",
            type: "NVARCHAR(200)",
            maxLength: 200,
            nullable: true);

        migrationBuilder.AddColumn<bool>(
            name: "IsManuallyDisabled",
            schema: "Basket",
            table: "DiscountCodes",
            type: "bit",
            nullable: false,
            defaultValue: false);

        migrationBuilder.CreateTable(
            name: "DiscountCodeCourses",
            schema: "Basket",
            columns: table => new
            {
                Id = table.Column<long>(type: "bigint", nullable: false)
                    .Annotation("SqlServer:Identity", "1, 1"),
                DiscountCodeId = table.Column<long>(type: "bigint", nullable: false),
                CourseId = table.Column<long>(type: "bigint", nullable: false),
                CreatedByUserId = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: true),
                CreatedDateTime = table.Column<DateTime>(type: "datetime2", nullable: true),
                ModifiedByUserId = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: true),
                ModifiedDateTime = table.Column<DateTime>(type: "datetime2", nullable: true),
                IsDelete = table.Column<bool>(type: "bit", nullable: false),
                BusinessId = table.Column<Guid>(type: "uniqueidentifier", nullable: false)
            },
            constraints: table =>
            {
                table.PrimaryKey("PK_DiscountCodeCourses", x => x.Id);
                table.ForeignKey(
                    name: "FK_DiscountCodeCourses_DiscountCodes_DiscountCodeId",
                    column: x => x.DiscountCodeId,
                    principalSchema: "Basket",
                    principalTable: "DiscountCodes",
                    principalColumn: "Id",
                    onDelete: ReferentialAction.Cascade);
            });

        migrationBuilder.CreateIndex(
            name: "IX_DiscountCodeCourses_DiscountCodeId_CourseId",
            schema: "Basket",
            table: "DiscountCodeCourses",
            columns: new[] { "DiscountCodeId", "CourseId" },
            unique: true);
    }

    protected override void Down(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.DropTable(name: "DiscountCodeCourses", schema: "Basket");

        migrationBuilder.DropColumn(name: "ScopeType", schema: "Basket", table: "DiscountCodes");
        migrationBuilder.DropColumn(name: "TeacherId", schema: "Basket", table: "DiscountCodes");
        migrationBuilder.DropColumn(name: "StudentUserId", schema: "Basket", table: "DiscountCodes");
        migrationBuilder.DropColumn(name: "Title", schema: "Basket", table: "DiscountCodes");
        migrationBuilder.DropColumn(name: "IsManuallyDisabled", schema: "Basket", table: "DiscountCodes");

        migrationBuilder.AlterColumn<string>(
            name: "Discount_Code",
            schema: "Basket",
            table: "DiscountCodes",
            type: "VARCHAR(10)",
            maxLength: 10,
            nullable: true,
            oldClrType: typeof(string),
            oldType: "VARCHAR(32)",
            oldMaxLength: 32,
            oldNullable: true);
    }
}
