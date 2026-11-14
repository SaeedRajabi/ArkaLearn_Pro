using ArkaSoftwarePro.Src.Core.Domain.TagAggregate.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using ArkaSoftwarePro.Src.Core.Domain.TagAggregate.ValueOBJs;

namespace ArkaSoftwarePro.Src.Infrastructure.Data.MSSQL.Commands.Configurations.TagsConfigure
{
    public class TagConfiguration : IEntityTypeConfiguration<Tag>
    {
        public void Configure(EntityTypeBuilder<Tag> builder)
        {
            builder.ToTable("Tags", "Tag");
            builder.Property(x => x.TagName).HasMaxLength(100).HasConversion(x => x.Value, x => new TagName(x)).IsRequired();
            builder.HasIndex(x => x.TagName);
        }
    }
}
