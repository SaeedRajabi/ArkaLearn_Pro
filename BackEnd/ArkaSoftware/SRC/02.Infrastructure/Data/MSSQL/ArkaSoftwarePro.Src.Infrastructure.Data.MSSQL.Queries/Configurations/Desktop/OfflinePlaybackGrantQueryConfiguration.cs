using ArkaSoftwarePro.Src.Infrastructure.Data.MSSQL.Queries.Entities.Desktop;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace ArkaSoftwarePro.Src.Infrastructure.Data.MSSQL.Queries.Configurations.Desktop;

public class OfflinePlaybackGrantQueryConfiguration : IEntityTypeConfiguration<OfflinePlaybackGrantQueryModel>
{
    public void Configure(EntityTypeBuilder<OfflinePlaybackGrantQueryModel> builder)
    {
        builder.ToTable("OfflinePlaybackGrants", "Desktop");
        builder.HasKey(x => x.Id);
        builder.Property(x => x.TokenHash).HasMaxLength(128);
        builder.Property(x => x.DeviceId).HasMaxLength(128);
        builder.Property(x => x.IsDelete).HasColumnName("IsDeleted");
    }
}
