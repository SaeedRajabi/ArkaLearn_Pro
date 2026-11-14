using ArkaSoftwarePro.Src.Core.Domain.TeacherAggregate.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace ArkaSoftwarePro.Src.Infrastructure.Data.MSSQL.Commands.Configurations.TeachersConfigure;

public class TeacherTeachingCategoryConfiguration : IEntityTypeConfiguration<TeacherTeachingCategory>
{
    public void Configure(EntityTypeBuilder<TeacherTeachingCategory> builder)
    {
        builder.ToTable("TeachingCategories", "Teacher");
        builder.Property(x => x.Name).HasMaxLength(200).IsRequired();
        builder.Property(x => x.Slug).HasMaxLength(200).IsRequired();
        builder.Property(x => x.Description).HasMaxLength(1000);
        builder.HasIndex(x => x.Slug).IsUnique();
    }
}

public class TeacherPromotionalVideoConfiguration : IEntityTypeConfiguration<TeacherPromotionalVideo>
{
    public void Configure(EntityTypeBuilder<TeacherPromotionalVideo> builder)
    {
        builder.ToTable("PromotionalVideos", "Teacher");
        builder.Property(x => x.Title).HasMaxLength(300).IsRequired();
        builder.Property(x => x.VideoUrl).HasMaxLength(2000).IsRequired();
        builder.Property(x => x.WatermarkedVideoUrl).HasMaxLength(2000);
        builder.Property(x => x.ThumbnailUrl).HasMaxLength(2000);
        builder.Property(x => x.ViewCount).HasDefaultValue(0);
        builder.Property(x => x.LikeCount).HasDefaultValue(0);
        builder.Property(x => x.SeoTitle).HasMaxLength(200);
        builder.Property(x => x.MetaDescription).HasMaxLength(320);
        builder.Property(x => x.OgImageUrl).HasMaxLength(500);
        builder.Property(x => x.RejectionNote).HasMaxLength(2000);
        builder.HasOne(x => x.Teacher).WithMany(x => x.PromotionalVideos)
            .HasForeignKey(x => x.TeacherId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}

public class TeacherBookConfiguration : IEntityTypeConfiguration<TeacherBook>
{
    public void Configure(EntityTypeBuilder<TeacherBook> builder)
    {
        builder.ToTable("Books", "Teacher");
        builder.Property(x => x.Title).HasMaxLength(300).IsRequired();
        builder.Property(x => x.Description).HasMaxLength(1000);
        builder.Property(x => x.LongDescriptionHtml).HasColumnType("NVARCHAR(MAX)");
        builder.Property(x => x.CoverImageUrl).HasMaxLength(2000);
        builder.Property(x => x.BookFileUrl).HasMaxLength(2000);
        builder.Property(x => x.BookFileName).HasMaxLength(260);
        builder.Property(x => x.PdfFileUrl).HasMaxLength(2000);
        builder.Property(x => x.PdfFileName).HasMaxLength(260);
        builder.Property(x => x.EpubFileUrl).HasMaxLength(2000);
        builder.Property(x => x.EpubFileName).HasMaxLength(260);
        builder.Property(x => x.WordFileUrl).HasMaxLength(2000);
        builder.Property(x => x.WordFileName).HasMaxLength(260);
        builder.Property(x => x.Publisher).HasMaxLength(200);
        builder.Property(x => x.Isbn).HasMaxLength(50);
        builder.Property(x => x.Slug).HasMaxLength(220).IsRequired();
        builder.Property(x => x.TagsJson).HasMaxLength(2000).HasDefaultValue("[]");
        builder.Property(x => x.SeoTitle).HasMaxLength(200);
        builder.Property(x => x.MetaDescription).HasMaxLength(320);
        builder.Property(x => x.OgImageUrl).HasMaxLength(500);
        builder.Property(x => x.RejectionNote).HasMaxLength(2000);
        builder.HasIndex(x => x.Slug).IsUnique();
        builder.HasOne(x => x.Teacher).WithMany(x => x.Books)
            .HasForeignKey(x => x.TeacherId)
            .OnDelete(DeleteBehavior.Cascade);
        builder.HasOne(x => x.Category).WithMany().HasForeignKey(x => x.CategoryId).OnDelete(DeleteBehavior.SetNull);
    }
}

public class TeacherPortfolioArticleConfiguration : IEntityTypeConfiguration<TeacherPortfolioArticle>
{
    public void Configure(EntityTypeBuilder<TeacherPortfolioArticle> builder)
    {
        builder.ToTable("PortfolioArticles", "Teacher");
        builder.Property(x => x.Title).HasMaxLength(300).IsRequired();
        builder.Property(x => x.Summary).HasMaxLength(1000);
        builder.Property(x => x.Content).HasColumnType("NVARCHAR(MAX)");
        builder.HasOne(x => x.Teacher).WithMany(x => x.PortfolioArticles)
            .HasForeignKey(x => x.TeacherId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}

public class TeacherPromotionalVideoLikeConfiguration : IEntityTypeConfiguration<TeacherPromotionalVideoLike>
{
    public void Configure(EntityTypeBuilder<TeacherPromotionalVideoLike> builder)
    {
        builder.ToTable("PromotionalVideoLikes", "Teacher");
        builder.HasIndex(x => new { x.VideoId, x.UserId }).IsUnique();
    }
}

public class TeacherPromotionalVideoCommentConfiguration : IEntityTypeConfiguration<TeacherPromotionalVideoComment>
{
    public void Configure(EntityTypeBuilder<TeacherPromotionalVideoComment> builder)
    {
        builder.ToTable("PromotionalVideoComments", "Teacher");
        builder.Property(x => x.Content).HasMaxLength(2000).IsRequired();
        builder.HasIndex(x => x.VideoId);
        builder.HasIndex(x => x.ParentId);
    }
}

public class TeacherAdvertisementConfiguration : IEntityTypeConfiguration<TeacherAdvertisement>
{
    public void Configure(EntityTypeBuilder<TeacherAdvertisement> builder)
    {
        builder.ToTable("Advertisements", "Teacher");
        builder.Property(x => x.Title).HasMaxLength(300).IsRequired();
        builder.Property(x => x.PrivateTeachingCost).HasColumnType("decimal(18,2)");
        builder.Property(x => x.HourlyTeachingCost).HasColumnType("decimal(18,2)");
        builder.Property(x => x.WorkExperience).HasMaxLength(2000);
        builder.Property(x => x.DescriptionHtml).HasColumnType("NVARCHAR(MAX)");
        builder.Property(x => x.WebsiteUrl).HasMaxLength(2000);
        builder.Property(x => x.WebsiteTitle).HasMaxLength(300);
        builder.Property(x => x.ContactPhone).HasMaxLength(50);
        builder.Property(x => x.BaleLink).HasMaxLength(2000);
        builder.Property(x => x.TelegramLink).HasMaxLength(2000);
        builder.Property(x => x.WhatsAppLink).HasMaxLength(2000);
        builder.Property(x => x.GitHubLink).HasMaxLength(2000);
        builder.Property(x => x.LinkedInLink).HasMaxLength(2000);
        builder.Property(x => x.TagsJson).HasMaxLength(2000).HasDefaultValue("[]");
        builder.Property(x => x.ListingStarLevel).HasDefaultValue(0);
        builder.Property(x => x.SeoTitle).HasMaxLength(200);
        builder.Property(x => x.MetaDescription).HasMaxLength(320);
        builder.Property(x => x.OgImageUrl).HasMaxLength(500);
        builder.HasOne(x => x.Teacher).WithOne(x => x.Advertisement)
            .HasForeignKey<TeacherAdvertisement>(x => x.TeacherId)
            .OnDelete(DeleteBehavior.Cascade);
        builder.HasIndex(x => x.TeacherId).IsUnique();
        builder.HasIndex(x => x.IsPublic);
    }
}

public class TeacherResumeConfiguration : IEntityTypeConfiguration<TeacherResume>
{
    public void Configure(EntityTypeBuilder<TeacherResume> builder)
    {
        builder.ToTable("Resumes", "Teacher");
        builder.Property(x => x.Title).HasMaxLength(300).IsRequired();
        builder.Property(x => x.Description).HasMaxLength(2000);
        builder.Property(x => x.PdfFileUrl).HasMaxLength(2000).IsRequired();
        builder.Property(x => x.PdfFileName).HasMaxLength(500);
        builder.HasOne(x => x.Teacher).WithOne(x => x.Resume)
            .HasForeignKey<TeacherResume>(x => x.TeacherId)
            .OnDelete(DeleteBehavior.Cascade);
        builder.HasIndex(x => x.TeacherId).IsUnique();
    }
}

public class AdvertisementMonetizationSettingsConfiguration : IEntityTypeConfiguration<AdvertisementMonetizationSettings>
{
    public void Configure(EntityTypeBuilder<AdvertisementMonetizationSettings> builder)
    {
        builder.ToTable("AdvertisementMonetizationSettings", "Teacher");
    }
}

public class AdvertisementTariffConfiguration : IEntityTypeConfiguration<AdvertisementTariff>
{
    public void Configure(EntityTypeBuilder<AdvertisementTariff> builder)
    {
        builder.ToTable("AdvertisementTariffs", "Teacher");
        builder.HasIndex(x => new { x.DurationMonths, x.StarLevel }).IsUnique();
        builder.Property(x => x.PriceToman).HasColumnType("bigint");
    }
}

public class TeacherAdvertisementSubscriptionConfiguration : IEntityTypeConfiguration<TeacherAdvertisementSubscription>
{
    public void Configure(EntityTypeBuilder<TeacherAdvertisementSubscription> builder)
    {
        builder.ToTable("AdvertisementSubscriptions", "Teacher");
        builder.HasIndex(x => new { x.TeacherId, x.Status });
        builder.Property(x => x.PaymentReference).HasMaxLength(200);
    }
}

public class TeacherAdvertisementContactUnlockConfiguration : IEntityTypeConfiguration<TeacherAdvertisementContactUnlock>
{
    public void Configure(EntityTypeBuilder<TeacherAdvertisementContactUnlock> builder)
    {
        builder.ToTable("AdvertisementContactUnlocks", "Teacher");
        builder.HasIndex(x => new { x.ViewerUserId, x.TeacherId });
        builder.Property(x => x.PaymentReference).HasMaxLength(200);
    }
}

public class AdvertisementAutoBumpPackageConfiguration : IEntityTypeConfiguration<AdvertisementAutoBumpPackage>
{
    public void Configure(EntityTypeBuilder<AdvertisementAutoBumpPackage> builder)
    {
        builder.ToTable("AdvertisementAutoBumpPackages", "Teacher");
        builder.Property(x => x.Name).HasMaxLength(200).IsRequired();
        builder.Property(x => x.PriceToman).HasColumnType("bigint");
    }
}

public class TeacherAdvertisementAutoBumpPurchaseConfiguration : IEntityTypeConfiguration<TeacherAdvertisementAutoBumpPurchase>
{
    public void Configure(EntityTypeBuilder<TeacherAdvertisementAutoBumpPurchase> builder)
    {
        builder.ToTable("AdvertisementAutoBumpPurchases", "Teacher");
        builder.HasIndex(x => new { x.TeacherId, x.ExpiresAtUtc });
        builder.Property(x => x.PaymentReference).HasMaxLength(200);
        builder.Property(x => x.PaidAmountToman).HasColumnType("bigint");
    }
}

public class AdvertisementMonetizationRevenueConfiguration : IEntityTypeConfiguration<AdvertisementMonetizationRevenue>
{
    public void Configure(EntityTypeBuilder<AdvertisementMonetizationRevenue> builder)
    {
        builder.ToTable("AdvertisementMonetizationRevenues", "Teacher");
        builder.HasIndex(x => x.OccurredAtUtc);
        builder.Property(x => x.AmountToman).HasColumnType("bigint");
        builder.Property(x => x.PaymentReference).HasMaxLength(200);
        builder.Property(x => x.Description).HasMaxLength(500);
    }
}

public class TeacherExperiencePointEventConfiguration : IEntityTypeConfiguration<TeacherExperiencePointEvent>
{
    public void Configure(EntityTypeBuilder<TeacherExperiencePointEvent> builder)
    {
        builder.ToTable("TeacherExperiencePointEvents", "Teacher");
        builder.HasIndex(x => new { x.TeacherId, x.OccurredAtUtc });
        builder.Property(x => x.Description).HasMaxLength(500);
    }
}
