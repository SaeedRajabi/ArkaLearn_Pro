using ArkaSoftwarePro.Src.Infrastructure.Data.MSSQL.Commands.Common;
using DatabaseConnectionSettingsEntity = ArkaSoftwarePro.Src.Core.Domain.DatabaseConnectionSettingsAggregate.Entities.DatabaseConnectionSettings;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace ArkaSoftwarePro.Src.Infrastructure.Data.MSSQL.Commands.Configurations.DatabaseConnectionSettingsConfigure;

public class DatabaseConnectionSettingsConfiguration : IEntityTypeConfiguration<DatabaseConnectionSettingsEntity>
{
    public void Configure(EntityTypeBuilder<DatabaseConnectionSettingsEntity> builder)
    {
        builder.ToTable("DatabaseConnectionSettings", "Website");
        builder.Property(x => x.Server).HasMaxLength(256).HasDefaultValue("localhost");
        builder.Property(x => x.Database).HasMaxLength(256).HasDefaultValue(string.Empty);
        builder.Property(x => x.UserId).HasMaxLength(128).HasDefaultValue(string.Empty);
        builder.Property(x => x.PasswordEncrypted).HasMaxLength(512);
    }
}
