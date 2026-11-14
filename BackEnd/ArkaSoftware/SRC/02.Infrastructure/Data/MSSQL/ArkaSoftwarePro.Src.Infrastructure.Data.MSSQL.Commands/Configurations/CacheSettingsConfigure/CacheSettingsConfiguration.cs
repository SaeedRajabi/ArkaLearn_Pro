using ArkaSoftwarePro.Src.Infrastructure.Data.MSSQL.Commands.Common;
using CacheSettingsEntity = ArkaSoftwarePro.Src.Core.Domain.CacheSettingsAggregate.Entities.CacheSettings;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace ArkaSoftwarePro.Src.Infrastructure.Data.MSSQL.Commands.Configurations.CacheSettingsConfigure;

public class CacheSettingsConfiguration : IEntityTypeConfiguration<CacheSettingsEntity>
{
    public void Configure(EntityTypeBuilder<CacheSettingsEntity> builder)
    {
        builder.ToTable("CacheSettings", "Website");
        // No store default on IsEnabled — false must always be written explicitly (never omitted as "CLR default").
        builder.Property(x => x.IsEnabled).IsRequired();
        builder.Property(x => x.Provider).HasMaxLength(32).HasDefaultValue("InMemory");
        builder.Property(x => x.DefaultTtlMinutes).HasDefaultValue(30);
        builder.Property(x => x.RedisHost).HasMaxLength(256).HasDefaultValue("127.0.0.1");
        builder.Property(x => x.RedisPort).HasDefaultValue(6379);
        builder.Property(x => x.RedisPasswordEncrypted).HasMaxLength(512);
        builder.Property(x => x.RedisInstanceName).HasMaxLength(128).HasDefaultValue("ArkaLearn:");
    }
}
