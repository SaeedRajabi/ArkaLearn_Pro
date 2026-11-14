using ArkaSoftwarePro.Src.Infrastructure.Data.MSSQL.Queries.Entities.Articles;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace ArkaSoftwarePro.Src.Infrastructure.Data.MSSQL.Queries.Configurations.ArticlesConfigure
{
    public class ArticleConfiguration : IEntityTypeConfiguration<ArticleQueryModel>
    {
        public void Configure(EntityTypeBuilder<ArticleQueryModel> builder)
        {
            builder.ToTable("Articles", "Article");
            builder.HasKey(x => x.Id);
            builder.Property(x => x.Title).HasMaxLength(200);
            builder.Property(x => x.Summary).HasMaxLength(500);
            builder.Property(x => x.Content);
            builder.Property(x => x.Slug).HasMaxLength(250);
            builder.Property(x => x.ThumbnailUrl).HasMaxLength(500);
            builder.Property(x => x.CreatedDateTime).HasColumnName("CreatedDateTime");
            builder.HasOne(x => x.Category).WithMany().HasForeignKey(x => x.CategoryId).OnDelete(DeleteBehavior.SetNull);
            builder.HasOne(x => x.AuthorUser).WithMany().HasForeignKey(x => x.AuthorUserId).OnDelete(DeleteBehavior.Restrict);
            builder.HasMany(x => x.Comments).WithOne(x => x.Article).HasForeignKey(x => x.ArticleId).OnDelete(DeleteBehavior.Cascade);
            builder.HasMany(x => x.Tags).WithOne(x => x.Article).HasForeignKey(x => x.ArticleId).OnDelete(DeleteBehavior.SetNull);
        }
    }
}
