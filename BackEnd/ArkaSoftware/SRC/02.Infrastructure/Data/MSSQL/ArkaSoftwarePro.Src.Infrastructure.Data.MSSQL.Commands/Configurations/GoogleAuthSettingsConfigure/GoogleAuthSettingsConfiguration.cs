using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using GoogleAuthSettingsEntity = ArkaSoftwarePro.Src.Core.Domain.GoogleAuthSettingsAggregate.Entities.GoogleAuthSettings;

namespace ArkaSoftwarePro.Src.Infrastructure.Data.MSSQL.Commands.Configurations.GoogleAuthSettingsConfigure;

public class GoogleAuthSettingsConfiguration : IEntityTypeConfiguration<GoogleAuthSettingsEntity>
{
    public void Configure(EntityTypeBuilder<GoogleAuthSettingsEntity> builder)
    {
        builder.ToTable("GoogleAuthSettings", "Website");
        builder.HasKey(x => x.Id);

        builder.Property(x => x.ClientId).HasColumnType("NVARCHAR").HasMaxLength(1000).IsRequired();
        builder.Property(x => x.ClientSecret).HasColumnType("NVARCHAR").HasMaxLength(1000).IsRequired();
        builder.Property(x => x.IsDelete).HasColumnType("bit");
    }
}
