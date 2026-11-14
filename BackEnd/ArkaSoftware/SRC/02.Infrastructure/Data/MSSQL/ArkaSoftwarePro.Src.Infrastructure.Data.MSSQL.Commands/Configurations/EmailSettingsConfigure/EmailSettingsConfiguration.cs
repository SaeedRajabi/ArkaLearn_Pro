using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using EmailSettingsEntity = ArkaSoftwarePro.Src.Core.Domain.EmailSettingsAggregate.Entities.EmailSettings;

namespace ArkaSoftwarePro.Src.Infrastructure.Data.MSSQL.Commands.Configurations.EmailSettingsConfigure;

public class EmailSettingsConfiguration : IEntityTypeConfiguration<EmailSettingsEntity>
{
    public void Configure(EntityTypeBuilder<EmailSettingsEntity> builder)
    {
        builder.ToTable("EmailSettings", "Website");
        builder.HasKey(x => x.Id);

        builder.Property(x => x.Host).HasColumnType("NVARCHAR").HasMaxLength(500).IsRequired();
        builder.Property(x => x.Username).HasColumnType("NVARCHAR").HasMaxLength(500).IsRequired();
        builder.Property(x => x.Password).HasColumnType("NVARCHAR").HasMaxLength(500).IsRequired();
        builder.Property(x => x.FromEmail).HasColumnType("NVARCHAR").HasMaxLength(500).IsRequired();
        builder.Property(x => x.FromName).HasColumnType("NVARCHAR").HasMaxLength(200).IsRequired();
        builder.Property(x => x.IsDelete).HasColumnType("bit");
    }
}
