using ArkaSoftwarePro.Src.Core.Domain.LiveMediaTransportSettingsAggregate.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace ArkaSoftwarePro.Src.Infrastructure.Data.MSSQL.Commands.Configurations.LiveMediaTransportSettingsConfigure;

public class LiveMediaTransportSettingsConfiguration : IEntityTypeConfiguration<LiveMediaTransportSettings>
{
    public void Configure(EntityTypeBuilder<LiveMediaTransportSettings> builder)
    {
        builder.ToTable("LiveMediaTransportSettings", "Website");
        builder.HasKey(x => x.Id);
        builder.Property(x => x.TransportMode).HasMaxLength(32).IsRequired();
        builder.Property(x => x.LiveKitUrl).HasMaxLength(512);
        builder.Property(x => x.LiveKitApiKey).HasMaxLength(256);
        builder.Property(x => x.LiveKitApiSecretEncrypted).HasMaxLength(512);
        builder.Property(x => x.TurnUrl).HasMaxLength(512);
        builder.Property(x => x.TurnUsername).HasMaxLength(128);
        builder.Property(x => x.TurnPasswordEncrypted).HasMaxLength(512);
        builder.Property(x => x.StunUrls).HasMaxLength(512);
        builder.Property(x => x.IsDelete).IsRequired();
    }
}
