using ArkaSoftwarePro.Src.Core.Domain.ContactUsAggregate.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace ArkaSoftwarePro.Src.Infrastructure.Data.MSSQL.Commands.Configurations.ContactUsConfigure
{
    public class ContactUsPageConfiguration : IEntityTypeConfiguration<ContactUsPage>
    {
        public void Configure(EntityTypeBuilder<ContactUsPage> builder)
        {
            builder.ToTable("ContactUsPages", "Website");

            builder.Property(x => x.PageTitle).HasColumnType("NVARCHAR").HasMaxLength(200).IsRequired();
            builder.Property(x => x.PageSubtitle).HasColumnType("NVARCHAR").HasMaxLength(500).IsRequired();
            builder.Property(x => x.HeroTitle).HasColumnType("NVARCHAR").HasMaxLength(200).IsRequired();
            builder.Property(x => x.HeroSubtitle).HasColumnType("NVARCHAR").HasMaxLength(500).IsRequired();
            builder.Property(x => x.HeadquartersTitle).HasColumnType("NVARCHAR").HasMaxLength(200).IsRequired();
            builder.Property(x => x.HeadquartersAddress).HasColumnType("NVARCHAR").HasMaxLength(500).IsRequired();
            builder.Property(x => x.HeadquartersPhone).HasColumnType("NVARCHAR").HasMaxLength(50).IsRequired();
            builder.Property(x => x.HeadquartersEmail).HasColumnType("NVARCHAR").HasMaxLength(200).IsRequired();
            builder.Property(x => x.ContactInfoTitle).HasColumnType("NVARCHAR").HasMaxLength(200).IsRequired();
            builder.Property(x => x.ContactInfoPhone).HasColumnType("NVARCHAR").HasMaxLength(50).IsRequired();
            builder.Property(x => x.ContactInfoEmail).HasColumnType("NVARCHAR").HasMaxLength(200).IsRequired();
            builder.Property(x => x.SalesSupportTitle).HasColumnType("NVARCHAR").HasMaxLength(200).IsRequired();
            builder.Property(x => x.SalesSupportPhone).HasColumnType("NVARCHAR").HasMaxLength(50).IsRequired();
            builder.Property(x => x.SalesSupportEmail).HasColumnType("NVARCHAR").HasMaxLength(200).IsRequired();
            builder.Property(x => x.FormTitle).HasColumnType("NVARCHAR").HasMaxLength(200).IsRequired();
            builder.Property(x => x.FormDescription).HasColumnType("NVARCHAR").HasMaxLength(1000).IsRequired();
            builder.Property(x => x.MapEmbedUrl).HasColumnType("NVARCHAR").HasMaxLength(1000).IsRequired();
            builder.Property(x => x.FacebookUrl).HasColumnType("NVARCHAR").HasMaxLength(500).IsRequired();
            builder.Property(x => x.TwitterUrl).HasColumnType("NVARCHAR").HasMaxLength(500).IsRequired();
            builder.Property(x => x.InstagramUrl).HasColumnType("NVARCHAR").HasMaxLength(500).IsRequired();
            builder.Property(x => x.LinkedInUrl).HasColumnType("NVARCHAR").HasMaxLength(500).IsRequired();
        }
    }
}
