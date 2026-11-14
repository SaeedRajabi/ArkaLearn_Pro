using ArkaSoftwarePro.Src.Core.Domain.NewsletterAggregate.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace ArkaSoftwarePro.Src.Infrastructure.Data.MSSQL.Commands.Configurations.NewsletterConfigure;

public class NewsletterSubscriberConfiguration : IEntityTypeConfiguration<NewsletterSubscriber>
{
    public void Configure(EntityTypeBuilder<NewsletterSubscriber> builder)
    {
        builder.ToTable("NewsletterSubscribers", "Website");

        builder.Property(x => x.Email)
            .HasColumnType("NVARCHAR")
            .HasMaxLength(256)
            .IsRequired();

        builder.HasIndex(x => x.Email)
            .IsUnique()
            .HasDatabaseName("IX_NewsletterSubscribers_Email");

        builder.Property(x => x.IsVerified)
            .IsRequired();

        builder.Property(x => x.UserId)
            .IsRequired(false);

        builder.Property(x => x.VerifiedAtUtc)
            .IsRequired(false);

        builder.Property(x => x.UnsubscribedAtUtc)
            .IsRequired(false);
    }
}
