using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;
using ArkaSoftwarePro.Src.Infrastructure.Data.MSSQL.Commands.Common;

#nullable disable

namespace ArkaSoftwarePro.Src.Infrastructure.Data.MSSQL.Commands.Migrations;

/// <summary>
/// Historical migration name kept for compatibility.
/// Uploader identity uses auditable ModifiedByUserId — do not add UploadedByUserId.
/// </summary>
[DbContext(typeof(ArkaSoftwareCommandDbContext))]
[Migration("20260719180000_AddUserFileUploadedByUserId")]
public partial class AddUserFileUploadedByUserId : Migration
{
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        // No-op: UserFiles.UploadedByUserId is not used; see ModifiedByUserId audit column.
    }

    protected override void Down(MigrationBuilder migrationBuilder)
    {
        // No-op
    }
}
