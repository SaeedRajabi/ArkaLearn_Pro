using ArkaSoftwarePro.Src.Infrastructure.Data.MSSQL.Queries.Entities.DatabaseConnectionSettings;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace ArkaSoftwarePro.Src.Infrastructure.Data.MSSQL.Queries.Configurations.DatabaseConnectionSettingsConfigure;

public class DatabaseConnectionSettingsQueryConfiguration : IEntityTypeConfiguration<DatabaseConnectionSettingsQueryModel>
{
    public void Configure(EntityTypeBuilder<DatabaseConnectionSettingsQueryModel> builder)
    {
        builder.ToTable("DatabaseConnectionSettings", "Website");
    }
}
