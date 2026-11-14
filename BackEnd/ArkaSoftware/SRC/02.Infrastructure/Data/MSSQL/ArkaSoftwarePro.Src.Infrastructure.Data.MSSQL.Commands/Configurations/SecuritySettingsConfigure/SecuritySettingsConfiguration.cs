using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using SecuritySettingsEntity = ArkaSoftwarePro.Src.Core.Domain.SecuritySettingsAggregate.Entities.SecuritySettings;

namespace ArkaSoftwarePro.Src.Infrastructure.Data.MSSQL.Commands.Configurations.SecuritySettingsConfigure;

public class SecuritySettingsConfiguration : IEntityTypeConfiguration<SecuritySettingsEntity>
{
    public void Configure(EntityTypeBuilder<SecuritySettingsEntity> builder)
    {
        builder.ToTable("SecuritySettings", "Website");
        builder.HasKey(x => x.Id);
        builder.Property(x => x.IsDelete).HasColumnType("bit");
    }
}
