using ArkaSoftwarePro.Src.Core.Domain.ArticleAggregate.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace ArkaSoftwarePro.Src.Infrastructure.Data.MSSQL.Commands.Configurations.ArticleConfigure
{
    public class ArticleReactionConfiguration : IEntityTypeConfiguration<ArticleReaction>
    {
        public void Configure(EntityTypeBuilder<ArticleReaction> builder)
        {
            builder.ToTable("ArticleReactions", "Article");
            builder.Property(x => x.Reaction).HasColumnType("INT").IsRequired();
            builder.HasIndex(x => new { x.ArticleId, x.UserId }).IsUnique();
        }
    }
}
