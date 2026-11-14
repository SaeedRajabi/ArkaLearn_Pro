using ArkaSoftwarePro.Src.Infrastructure.Data.MSSQL.Queries.Entities.CacheSettings;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace ArkaSoftwarePro.Src.Infrastructure.Data.MSSQL.Queries.Configurations.CacheSettingsConfigure;

public class CacheSettingsQueryConfiguration : IEntityTypeConfiguration<CacheSettingsQueryModel>
{
    public void Configure(EntityTypeBuilder<CacheSettingsQueryModel> builder)
    {
        builder.ToTable("CacheSettings", "Website");
        builder.HasKey(x => x.Id);
        builder.Property(x => x.Provider).HasMaxLength(32);
        builder.Property(x => x.RedisHost).HasMaxLength(256);
        builder.Property(x => x.RedisPasswordEncrypted).HasMaxLength(512);
        builder.Property(x => x.RedisInstanceName).HasMaxLength(128);
    }
}
