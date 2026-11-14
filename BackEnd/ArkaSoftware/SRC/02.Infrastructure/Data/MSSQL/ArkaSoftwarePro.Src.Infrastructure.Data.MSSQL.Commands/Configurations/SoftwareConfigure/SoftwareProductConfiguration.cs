using ArkaSoftwarePro.Src.Core.Domain.SoftwareAggregate.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace ArkaSoftwarePro.Src.Infrastructure.Data.MSSQL.Commands.Configurations.SoftwareConfigure;

public class SoftwareProductConfiguration : IEntityTypeConfiguration<SoftwareProduct>
{
    public void Configure(EntityTypeBuilder<SoftwareProduct> builder)
    {
        builder.ToTable("Products", "Software");
        builder.Property(x => x.Title).HasMaxLength(300).IsRequired();
        builder.Property(x => x.Description).HasMaxLength(1000);
        builder.Property(x => x.LongDescriptionHtml).HasColumnType("NVARCHAR(MAX)");
        builder.Property(x => x.CoverImageUrl).HasMaxLength(2000);
        builder.Property(x => x.InstallerFileUrl).HasMaxLength(2000);
        builder.Property(x => x.InstallerFileName).HasMaxLength(260);
        builder.Property(x => x.Slug).HasMaxLength(220).IsRequired();
        builder.Property(x => x.TagsJson).HasMaxLength(2000).HasDefaultValue("[]");
        builder.Property(x => x.DownloadCount).HasDefaultValue(0);
        builder.Property(x => x.LikeCount).HasDefaultValue(0);
        builder.Property(x => x.ApprovedSnapshotJson).HasColumnType("NVARCHAR(MAX)");
        builder.Property(x => x.SeoTitle).HasMaxLength(200);
        builder.Property(x => x.MetaDescription).HasMaxLength(320);
        builder.Property(x => x.OgImageUrl).HasMaxLength(500);
        builder.HasIndex(x => x.Slug).IsUnique();
        builder.HasIndex(x => x.TeacherId);
        builder.HasIndex(x => x.CategoryId);
        builder.HasOne(x => x.Teacher).WithMany().HasForeignKey(x => x.TeacherId).OnDelete(DeleteBehavior.Cascade);
        builder.HasOne(x => x.Category).WithMany().HasForeignKey(x => x.CategoryId).OnDelete(DeleteBehavior.SetNull);
    }
}

public class SoftwareProductLikeConfiguration : IEntityTypeConfiguration<SoftwareProductLike>
{
    public void Configure(EntityTypeBuilder<SoftwareProductLike> builder)
    {
        builder.ToTable("Likes", "Software");
        builder.HasIndex(x => new { x.SoftwareProductId, x.UserId }).IsUnique();
        builder.HasOne(x => x.SoftwareProduct).WithMany().HasForeignKey(x => x.SoftwareProductId).OnDelete(DeleteBehavior.Cascade);
    }
}
