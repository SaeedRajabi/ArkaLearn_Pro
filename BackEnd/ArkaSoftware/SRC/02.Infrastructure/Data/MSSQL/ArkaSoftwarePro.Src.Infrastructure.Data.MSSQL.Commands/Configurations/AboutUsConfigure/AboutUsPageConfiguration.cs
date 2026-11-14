using ArkaSoftwarePro.Src.Core.Domain.AboutUsAggregate.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace ArkaSoftwarePro.Src.Infrastructure.Data.MSSQL.Commands.Configurations.AboutUsConfigure
{
    public class AboutUsPageConfiguration : IEntityTypeConfiguration<AboutUsPage>
    {
        public void Configure(EntityTypeBuilder<AboutUsPage> builder)
        {
            builder.ToTable("AboutUsPages", "Website");

            builder.Property(x => x.HeroTitle)
                .HasColumnType("NVARCHAR")
                .HasMaxLength(200)
                .IsRequired();

            builder.Property(x => x.HeroSubtitle)
                .HasColumnType("NVARCHAR")
                .HasMaxLength(500)
                .IsRequired();

            builder.Property(x => x.HeroImageUrl)
                .HasColumnType("NVARCHAR")
                .HasMaxLength(600)
                .IsRequired();

            builder.Property(x => x.IntroTitle)
                .HasColumnType("NVARCHAR")
                .HasMaxLength(200)
                .IsRequired();

            builder.Property(x => x.IntroContentHtml)
                .HasColumnType("NVARCHAR(MAX)")
                .IsRequired();

            builder.Property(x => x.MissionTitle)
                .HasColumnType("NVARCHAR")
                .HasMaxLength(200)
                .IsRequired();

            builder.Property(x => x.MissionContentHtml)
                .HasColumnType("NVARCHAR(MAX)")
                .IsRequired();

            builder.Property(x => x.VisionTitle)
                .HasColumnType("NVARCHAR")
                .HasMaxLength(200)
                .IsRequired();

            builder.Property(x => x.VisionContentHtml)
                .HasColumnType("NVARCHAR(MAX)")
                .IsRequired();

            builder.Property(x => x.ValuesTitle)
                .HasColumnType("NVARCHAR")
                .HasMaxLength(200)
                .IsRequired();

            builder.Property(x => x.ValuesContentHtml)
                .HasColumnType("NVARCHAR(MAX)")
                .IsRequired();

            builder.Property(x => x.TeamTitle)
                .HasColumnType("NVARCHAR")
                .HasMaxLength(200)
                .IsRequired();

            builder.Property(x => x.TeamContentHtml)
                .HasColumnType("NVARCHAR(MAX)")
                .IsRequired();

            builder.Property(x => x.TeamImageUrl)
                .HasColumnType("NVARCHAR")
                .HasMaxLength(600)
                .IsRequired();

            builder.Property(x => x.CtaTitle)
                .HasColumnType("NVARCHAR")
                .HasMaxLength(200)
                .IsRequired();

            builder.Property(x => x.CtaSubtitle)
                .HasColumnType("NVARCHAR")
                .HasMaxLength(500)
                .IsRequired();

            builder.Property(x => x.CtaButtonText)
                .HasColumnType("NVARCHAR")
                .HasMaxLength(120)
                .IsRequired();

            builder.Property(x => x.CtaButtonUrl)
                .HasColumnType("NVARCHAR")
                .HasMaxLength(500)
                .IsRequired();

            builder.HasMany(x => x.TeamMembers)
                .WithOne(x => x.AboutUsPage)
                .HasForeignKey(x => x.AboutUsPageId)
                .OnDelete(DeleteBehavior.Cascade);
        }
    }
}
