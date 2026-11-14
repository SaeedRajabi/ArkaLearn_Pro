using ArkaSoftwarePro.Src.Infrastructure.Data.MSSQL.Queries.Entities.SecuritySettings;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace ArkaSoftwarePro.Src.Infrastructure.Data.MSSQL.Queries.Configurations.SecuritySettingsConfigure;

public class SecuritySettingsQueryConfiguration : IEntityTypeConfiguration<SecuritySettingsQueryModel>
{
    public void Configure(EntityTypeBuilder<SecuritySettingsQueryModel> builder)
    {
        builder.ToTable("SecuritySettings", "Website");
        builder.HasKey(x => x.Id);
    }
}
