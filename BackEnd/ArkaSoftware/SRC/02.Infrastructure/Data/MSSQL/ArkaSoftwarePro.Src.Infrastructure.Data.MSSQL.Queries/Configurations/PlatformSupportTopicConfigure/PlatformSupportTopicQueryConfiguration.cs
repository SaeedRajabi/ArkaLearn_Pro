using ArkaSoftwarePro.Src.Infrastructure.Data.MSSQL.Queries.Entities.PlatformSupportTopics;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace ArkaSoftwarePro.Src.Infrastructure.Data.MSSQL.Queries.Configurations.PlatformSupportTopicConfigure;

public class PlatformSupportTopicQueryConfiguration : IEntityTypeConfiguration<PlatformSupportTopicQueryModel>
{
    public void Configure(EntityTypeBuilder<PlatformSupportTopicQueryModel> builder)
    {
        builder.ToTable("PlatformSupportTopics", "Website");
        builder.HasKey(x => x.Id);

        builder.Property(x => x.Title).HasColumnType("NVARCHAR").HasMaxLength(300);
        builder.Property(x => x.Summary).HasColumnType("NVARCHAR").HasMaxLength(500);
        builder.Property(x => x.ContentHtml).HasColumnType("NVARCHAR(MAX)");
        builder.Property(x => x.Department).HasColumnType("NVARCHAR").HasMaxLength(50);
    }
}
