using ArkaSoftwarePro.Src.Core.Domain.SiteAnnouncementAggregate.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace ArkaSoftwarePro.Src.Infrastructure.Data.MSSQL.Commands.Configurations.SiteAnnouncementConfigure;

public class SiteAnnouncementConfiguration : IEntityTypeConfiguration<SiteAnnouncement>
{
    public void Configure(EntityTypeBuilder<SiteAnnouncement> builder)
    {
        builder.ToTable("SiteAnnouncements", "Website");

        builder.Property(x => x.ContentHtml)
            .HasColumnType("NVARCHAR(MAX)")
            .IsRequired();

        builder.Property(x => x.TextColor)
            .HasColumnType("NVARCHAR")
            .HasMaxLength(20)
            .IsRequired();

        builder.Property(x => x.BackgroundType)
            .HasColumnType("tinyint")
            .IsRequired();

        builder.Property(x => x.BackgroundColor)
            .HasColumnType("NVARCHAR")
            .HasMaxLength(20)
            .IsRequired();

        builder.Property(x => x.GradientStartColor)
            .HasColumnType("NVARCHAR")
            .HasMaxLength(20)
            .IsRequired();

        builder.Property(x => x.GradientEndColor)
            .HasColumnType("NVARCHAR")
            .HasMaxLength(20)
            .IsRequired();

        builder.Property(x => x.GradientAngle)
            .IsRequired();

        builder.Property(x => x.BackgroundImageUrl)
            .HasColumnType("NVARCHAR")
            .HasMaxLength(600)
            .IsRequired();
    }
}
