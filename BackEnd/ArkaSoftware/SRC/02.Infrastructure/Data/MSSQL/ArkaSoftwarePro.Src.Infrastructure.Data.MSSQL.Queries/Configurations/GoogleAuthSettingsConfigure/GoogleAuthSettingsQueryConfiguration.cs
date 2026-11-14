using ArkaSoftwarePro.Src.Infrastructure.Data.MSSQL.Queries.Entities.GoogleAuthSettings;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace ArkaSoftwarePro.Src.Infrastructure.Data.MSSQL.Queries.Configurations.GoogleAuthSettingsConfigure;

public class GoogleAuthSettingsQueryConfiguration : IEntityTypeConfiguration<GoogleAuthSettingsQueryModel>
{
    public void Configure(EntityTypeBuilder<GoogleAuthSettingsQueryModel> builder)
    {
        builder.ToTable("GoogleAuthSettings", "Website");
        builder.HasKey(x => x.Id);
        builder.Property(x => x.ClientId).HasColumnType("NVARCHAR").HasMaxLength(1000);
        builder.Property(x => x.ClientSecret).HasColumnType("NVARCHAR").HasMaxLength(1000);
    }
}
