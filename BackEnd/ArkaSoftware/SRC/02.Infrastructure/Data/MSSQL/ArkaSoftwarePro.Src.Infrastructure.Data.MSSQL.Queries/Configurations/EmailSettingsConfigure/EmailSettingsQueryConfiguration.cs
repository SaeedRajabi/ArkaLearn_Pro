using ArkaSoftwarePro.Src.Infrastructure.Data.MSSQL.Queries.Entities.EmailSettings;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace ArkaSoftwarePro.Src.Infrastructure.Data.MSSQL.Queries.Configurations.EmailSettingsConfigure;

public class EmailSettingsQueryConfiguration : IEntityTypeConfiguration<EmailSettingsQueryModel>
{
    public void Configure(EntityTypeBuilder<EmailSettingsQueryModel> builder)
    {
        builder.ToTable("EmailSettings", "Website");
        builder.HasKey(x => x.Id);
        builder.Property(x => x.Host).HasColumnType("NVARCHAR").HasMaxLength(500);
        builder.Property(x => x.Username).HasColumnType("NVARCHAR").HasMaxLength(500);
        builder.Property(x => x.Password).HasColumnType("NVARCHAR").HasMaxLength(500);
        builder.Property(x => x.FromEmail).HasColumnType("NVARCHAR").HasMaxLength(500);
        builder.Property(x => x.FromName).HasColumnType("NVARCHAR").HasMaxLength(200);
    }
}
