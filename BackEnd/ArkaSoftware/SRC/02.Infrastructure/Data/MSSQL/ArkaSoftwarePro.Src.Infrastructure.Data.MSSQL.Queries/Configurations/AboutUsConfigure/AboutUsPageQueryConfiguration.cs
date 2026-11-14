using ArkaSoftwarePro.Src.Infrastructure.Data.MSSQL.Queries.Entities.AboutUs;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace ArkaSoftwarePro.Src.Infrastructure.Data.MSSQL.Queries.Configurations.AboutUsConfigure
{
    public class AboutUsPageQueryConfiguration : IEntityTypeConfiguration<AboutUsPageQueryModel>
    {
        public void Configure(EntityTypeBuilder<AboutUsPageQueryModel> builder)
        {
            builder.ToTable("AboutUsPages", "Website");
            builder.HasKey(x => x.Id);

            builder.Property(x => x.HeroTitle).HasColumnType("NVARCHAR").HasMaxLength(200);
            builder.Property(x => x.HeroSubtitle).HasColumnType("NVARCHAR").HasMaxLength(500);
            builder.Property(x => x.HeroImageUrl).HasColumnType("NVARCHAR").HasMaxLength(600);
            builder.Property(x => x.IntroTitle).HasColumnType("NVARCHAR").HasMaxLength(200);
            builder.Property(x => x.IntroContentHtml).HasColumnType("NVARCHAR(MAX)");
            builder.Property(x => x.MissionTitle).HasColumnType("NVARCHAR").HasMaxLength(200);
            builder.Property(x => x.MissionContentHtml).HasColumnType("NVARCHAR(MAX)");
            builder.Property(x => x.VisionTitle).HasColumnType("NVARCHAR").HasMaxLength(200);
            builder.Property(x => x.VisionContentHtml).HasColumnType("NVARCHAR(MAX)");
            builder.Property(x => x.ValuesTitle).HasColumnType("NVARCHAR").HasMaxLength(200);
            builder.Property(x => x.ValuesContentHtml).HasColumnType("NVARCHAR(MAX)");
            builder.Property(x => x.TeamTitle).HasColumnType("NVARCHAR").HasMaxLength(200);
            builder.Property(x => x.TeamContentHtml).HasColumnType("NVARCHAR(MAX)");
            builder.Property(x => x.TeamImageUrl).HasColumnType("NVARCHAR").HasMaxLength(600);
            builder.Property(x => x.CtaTitle).HasColumnType("NVARCHAR").HasMaxLength(200);
            builder.Property(x => x.CtaSubtitle).HasColumnType("NVARCHAR").HasMaxLength(500);
            builder.Property(x => x.CtaButtonText).HasColumnType("NVARCHAR").HasMaxLength(120);
            builder.Property(x => x.CtaButtonUrl).HasColumnType("NVARCHAR").HasMaxLength(500);
            builder.Property(x => x.ModifiedDateTime).HasColumnType("DATETIME2").HasColumnName("ModifiedDateTime");
            builder.Property(x => x.CreatedDateTime).HasColumnType("DATETIME2").HasColumnName("CreatedDateTime");

            builder.HasMany(x => x.TeamMembers)
                .WithOne(x => x.AboutUsPage)
                .HasForeignKey(x => x.AboutUsPageId)
                .OnDelete(DeleteBehavior.Cascade);
        }
    }
}
