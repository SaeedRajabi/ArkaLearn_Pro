using ArkaSoftwarePro.Src.Core.Domain.PlatformSupportTopicAggregate.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace ArkaSoftwarePro.Src.Infrastructure.Data.MSSQL.Commands.Configurations.PlatformSupportTopicConfigure;

public class PlatformSupportTopicConfiguration : IEntityTypeConfiguration<PlatformSupportTopic>
{
    public void Configure(EntityTypeBuilder<PlatformSupportTopic> builder)
    {
        builder.ToTable("PlatformSupportTopics", "Website");
        builder.HasKey(x => x.Id);

        builder.Property(x => x.Title).HasColumnType("NVARCHAR").HasMaxLength(300).IsRequired();
        builder.Property(x => x.Summary).HasColumnType("NVARCHAR").HasMaxLength(500).IsRequired();
        builder.Property(x => x.ContentHtml).HasColumnType("NVARCHAR(MAX)").IsRequired();
        builder.Property(x => x.Department).HasColumnType("NVARCHAR").HasMaxLength(50);
        builder.Property(x => x.IsDelete).HasColumnType("bit");
    }
}
