using ArkaSoftwarePro.Src.Infrastructure.Data.MSSQL.Queries.Entities.Tags;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace ArkaSoftwarePro.Src.Infrastructure.Data.MSSQL.Queries.Configurations.TagsConfigure
{
    public class TagConfiguration : IEntityTypeConfiguration<TagQueryModel>
    {
        void IEntityTypeConfiguration<TagQueryModel>.Configure(EntityTypeBuilder<TagQueryModel> builder)
        {
            builder.ToTable("Tags", "Tag").HasKey(x => x.Id);
            builder.Property(x => x.Id).HasColumnName("Id");
            builder.Property(x => x.TagName).HasColumnName("TagName");
            builder.Property(x => x.ArticleId).HasColumnName("ArticleId");
            builder.Property(x => x.SeminarId).HasColumnName("SeminarId");
            builder.Property(x => x.ProjectId).HasColumnName("ProjectId");
            builder.HasOne(x => x.Article).WithMany(x => x.Tags).HasForeignKey(x => x.ArticleId).OnDelete(DeleteBehavior.SetNull);
            builder.HasOne(x => x.Seminar).WithMany(x => x.Tags).HasForeignKey(x => x.SeminarId).OnDelete(DeleteBehavior.Cascade);
            builder.HasOne(x => x.Project).WithMany(x => x.Tags).HasForeignKey(x => x.ProjectId).OnDelete(DeleteBehavior.SetNull);
        }
    }
}
