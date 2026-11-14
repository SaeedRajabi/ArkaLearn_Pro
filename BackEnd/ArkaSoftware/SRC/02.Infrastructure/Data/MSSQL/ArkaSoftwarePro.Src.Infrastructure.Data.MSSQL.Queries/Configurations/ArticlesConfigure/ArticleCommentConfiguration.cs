using ArkaSoftwarePro.Src.Infrastructure.Data.MSSQL.Queries.Entities.Articles;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace ArkaSoftwarePro.Src.Infrastructure.Data.MSSQL.Queries.Configurations.ArticlesConfigure
{
    public class ArticleCommentConfiguration : IEntityTypeConfiguration<ArticleCommentQueryModel>
    {
        public void Configure(EntityTypeBuilder<ArticleCommentQueryModel> builder)
        {
            builder.ToTable("ArticleComments", "Article");
            builder.HasKey(x => x.Id);
            builder.Property(x => x.CommentText).HasMaxLength(600).HasColumnName("Content");
            builder.Property(x => x.Likes).HasColumnType("INT").HasColumnName("Like");
            builder.Property(x => x.CreateAt).HasColumnName("CreatedDateTime");
            builder.HasOne(x => x.User).WithMany().HasForeignKey(x => x.UserId).OnDelete(DeleteBehavior.SetNull);
        }
    }
}
