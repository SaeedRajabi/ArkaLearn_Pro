using ArkaSoftwarePro.Src.Core.Domain.ArticleAggregate.Entities;
using ArkaSoftwarePro.Src.Core.Domain.ArticleAggregate.ValueOBJs;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace ArkaSoftwarePro.Src.Infrastructure.Data.MSSQL.Commands.Configurations.ArticleConfigure
{
    public class ArticleConfiguration : IEntityTypeConfiguration<Article>
    {
        public void Configure(EntityTypeBuilder<Article> builder)
        {
            builder.ToTable("Articles", "Article");
            builder.Property(x => x.Title).HasMaxLength(200).HasConversion(x => x!.Value, x => new ArticleTitle(x)).IsRequired();
            builder.Property(x => x.Summary).HasMaxLength(500).HasConversion(x => x!.Value, x => new ArticleSummary(x));
            builder.Property(x => x.Content).HasMaxLength(int.MaxValue).HasConversion(x => x!.Value, x => new ArticleContent(x));
            builder.Property(x => x.Slug).HasMaxLength(250).HasConversion(x => x!.Value, x => new Slug(x)).IsRequired();
            builder.Property(x => x.ThumbnailUrl).HasMaxLength(500);
            builder.Property(x => x.SeoTitle).HasMaxLength(200);
            builder.Property(x => x.MetaDescription).HasMaxLength(320);
            builder.Property(x => x.OgImageUrl).HasMaxLength(500);
            builder.Property(x => x.AuthorUserId).IsRequired();
            builder.HasOne(x => x.Category).WithMany().HasForeignKey(x => x.CategoryId).OnDelete(DeleteBehavior.SetNull);
            builder.HasMany(x => x.ArticleComments).WithOne().HasForeignKey(x => x.ArticleId).OnDelete(DeleteBehavior.Cascade);
            builder.HasIndex(x => x.Slug).IsUnique();
            builder.HasIndex(x => x.AuthorUserId);
        }
    }
}
