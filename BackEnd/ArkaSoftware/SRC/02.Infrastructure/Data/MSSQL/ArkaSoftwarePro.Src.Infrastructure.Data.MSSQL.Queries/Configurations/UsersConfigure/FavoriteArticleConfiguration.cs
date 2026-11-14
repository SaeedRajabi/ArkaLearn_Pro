using ArkaSoftwarePro.Src.Infrastructure.Data.MSSQL.Queries.Entities.Users;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace ArkaSoftwarePro.Src.Infrastructure.Data.MSSQL.Queries.Configurations.UsersConfigure
{
    public class FavoriteArticleConfiguration : IEntityTypeConfiguration<FavoriteArticleQueryModel>
    {
        public void Configure(EntityTypeBuilder<FavoriteArticleQueryModel> builder)
        {
            builder.ToTable("FavoriteArticles", "User");
            builder.HasKey(x => x.Id);
            builder.Property(x => x.UserId).HasColumnType("BIGINT");
            builder.Property(x => x.ArticleId).HasColumnType("BIGINT");
            builder.Property(x => x.CreatedAt).HasColumnType("DATETIME2");

            builder.HasIndex(x => new { x.UserId, x.ArticleId }).IsUnique();
            builder.HasOne(x => x.Article)
                .WithMany()
                .HasForeignKey(x => x.ArticleId)
                .OnDelete(DeleteBehavior.Cascade);
        }
    }
}
