using ArkaSoftwarePro.Src.Infrastructure.Data.MSSQL.Queries.Entities.Articles;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace ArkaSoftwarePro.Src.Infrastructure.Data.MSSQL.Queries.Configurations.ArticleConfigure;

public class ArticleReactionQueryConfiguration : IEntityTypeConfiguration<ArticleReactionQueryModel>
{
    public void Configure(EntityTypeBuilder<ArticleReactionQueryModel> builder)
    {
        builder.ToTable("ArticleReactions", "Article");
        builder.HasKey(x => x.Id);
        builder.Property(x => x.ArticleId).IsRequired();
        builder.Property(x => x.UserId).IsRequired();
        builder.Property(x => x.Reaction).IsRequired();
    }
}
