using ArkaSoftwarePro.Src.Infrastructure.Data.MSSQL.Queries.Entities.MediaAssets;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace ArkaSoftwarePro.Src.Infrastructure.Data.MSSQL.Queries.Configurations.MediaAssetsConfigure;

public class MediaAssetQueryModelConfiguration : IEntityTypeConfiguration<MediaAssetQueryModel>
{
    public void Configure(EntityTypeBuilder<MediaAssetQueryModel> builder)
    {
        builder.ToTable("MediaAssets", "Media");
        builder.HasKey(x => x.Id);

        builder.Property(x => x.CreatedDateTime).HasColumnName("CreatedDateTime").IsRequired(false);
        builder.Property(x => x.ModifiedDateTime).HasColumnName("ModifiedDateTime").IsRequired(false);
        // Legacy/new DBs may use IsDeleted; framework entities use IsDelete in code.
        builder.Property(x => x.IsDelete).HasColumnName("IsDeleted");
    }
}
