using ArkaSoftwarePro.Src.Core.Domain.ArticleAggregate.Entities;
using ArkaSoftwarePro.Src.Core.Domain.CoursesAggregate.ValueOBJs;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace ArkaSoftwarePro.Src.Infrastructure.Data.MSSQL.Commands.Configurations.ArticleConfigure
{
    public class ArticleCommentConfiguration : IEntityTypeConfiguration<ArticleComment>
    {
        public void Configure(EntityTypeBuilder<ArticleComment> builder)
        {
            builder.ToTable("ArticleComments", "Article");
            builder.Property(x => x.Content).HasMaxLength(600).HasConversion(x => x!.Value, x => new CommentContent(x!)).IsRequired();
            builder.Property(x => x.Rating).HasColumnType("INT");
            builder.Property(x => x.Like).HasColumnType("INT");
            builder.Property(x => x.IsApproved).IsRequired();
        }
    }
}
