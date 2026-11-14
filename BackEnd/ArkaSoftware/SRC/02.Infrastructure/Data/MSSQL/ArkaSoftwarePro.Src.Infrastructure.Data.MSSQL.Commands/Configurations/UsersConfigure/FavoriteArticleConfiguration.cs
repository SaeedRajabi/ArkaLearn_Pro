using ArkaSoftwarePro.Src.Core.Domain.ArticleAggregate.Entities;
using ArkaSoftwarePro.Src.Core.Domain.UsersAggregate.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace ArkaSoftwarePro.Src.Infrastructure.Data.MSSQL.Commands.Configurations.UsersConfigure
{
    public class FavoriteArticleConfiguration : IEntityTypeConfiguration<FavoriteArticle>
    {
        public void Configure(EntityTypeBuilder<FavoriteArticle> builder)
        {
            builder.ToTable("FavoriteArticles", "User");
            builder.HasKey(x => x.Id);
            builder.Property(x => x.UserId).HasColumnType("BIGINT").IsRequired();
            builder.Property(x => x.ArticleId).HasColumnType("BIGINT").IsRequired();
            builder.Property(x => x.CreatedAt).HasColumnType("DATETIME2").IsRequired();

            builder.HasIndex(x => new { x.UserId, x.ArticleId }).IsUnique();
            builder.HasOne<User>().WithMany().HasForeignKey(x => x.UserId).OnDelete(DeleteBehavior.Cascade);
            builder.HasOne<Article>().WithMany().HasForeignKey(x => x.ArticleId).OnDelete(DeleteBehavior.Cascade);
        }
    }
}
