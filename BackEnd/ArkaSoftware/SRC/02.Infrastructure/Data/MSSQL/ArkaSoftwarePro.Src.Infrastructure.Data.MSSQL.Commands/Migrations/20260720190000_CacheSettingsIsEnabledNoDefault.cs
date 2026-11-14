using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ArkaSoftwarePro.Src.Infrastructure.Data.MSSQL.Commands.Migrations;

/// <summary>
/// Drop store default on IsEnabled so false is never replaced by SQL DEFAULT(1) on insert/update quirks.
/// </summary>
public partial class CacheSettingsIsEnabledNoDefault : Migration
{
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.AlterColumn<bool>(
            name: "IsEnabled",
            schema: "Website",
            table: "CacheSettings",
            type: "bit",
            nullable: false,
            oldClrType: typeof(bool),
            oldType: "bit",
            oldDefaultValue: true);
    }

    protected override void Down(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.AlterColumn<bool>(
            name: "IsEnabled",
            schema: "Website",
            table: "CacheSettings",
            type: "bit",
            nullable: false,
            defaultValue: true,
            oldClrType: typeof(bool),
            oldType: "bit");
    }
}
