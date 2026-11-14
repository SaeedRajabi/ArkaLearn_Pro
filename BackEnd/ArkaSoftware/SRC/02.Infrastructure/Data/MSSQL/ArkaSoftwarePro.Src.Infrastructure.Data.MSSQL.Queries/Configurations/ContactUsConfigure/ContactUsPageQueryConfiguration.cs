using ArkaSoftwarePro.Src.Infrastructure.Data.MSSQL.Queries.Entities.ContactUs;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace ArkaSoftwarePro.Src.Infrastructure.Data.MSSQL.Queries.Configurations.ContactUsConfigure
{
    public class ContactUsPageQueryConfiguration : IEntityTypeConfiguration<ContactUsPageQueryModel>
    {
        public void Configure(EntityTypeBuilder<ContactUsPageQueryModel> builder)
        {
            builder.ToTable("ContactUsPages", "Website");
            builder.HasKey(x => x.Id);

            builder.Property(x => x.PageTitle).HasColumnType("NVARCHAR").HasMaxLength(200);
            builder.Property(x => x.PageSubtitle).HasColumnType("NVARCHAR").HasMaxLength(500);
            builder.Property(x => x.HeroTitle).HasColumnType("NVARCHAR").HasMaxLength(200);
            builder.Property(x => x.HeroSubtitle).HasColumnType("NVARCHAR").HasMaxLength(500);
            builder.Property(x => x.HeadquartersTitle).HasColumnType("NVARCHAR").HasMaxLength(200);
            builder.Property(x => x.HeadquartersAddress).HasColumnType("NVARCHAR").HasMaxLength(500);
            builder.Property(x => x.HeadquartersPhone).HasColumnType("NVARCHAR").HasMaxLength(50);
            builder.Property(x => x.HeadquartersEmail).HasColumnType("NVARCHAR").HasMaxLength(200);
            builder.Property(x => x.ContactInfoTitle).HasColumnType("NVARCHAR").HasMaxLength(200);
            builder.Property(x => x.ContactInfoPhone).HasColumnType("NVARCHAR").HasMaxLength(50);
            builder.Property(x => x.ContactInfoEmail).HasColumnType("NVARCHAR").HasMaxLength(200);
            builder.Property(x => x.SalesSupportTitle).HasColumnType("NVARCHAR").HasMaxLength(200);
            builder.Property(x => x.SalesSupportPhone).HasColumnType("NVARCHAR").HasMaxLength(50);
            builder.Property(x => x.SalesSupportEmail).HasColumnType("NVARCHAR").HasMaxLength(200);
            builder.Property(x => x.FormTitle).HasColumnType("NVARCHAR").HasMaxLength(200);
            builder.Property(x => x.FormDescription).HasColumnType("NVARCHAR").HasMaxLength(1000);
            builder.Property(x => x.MapEmbedUrl).HasColumnType("NVARCHAR").HasMaxLength(1000);
            builder.Property(x => x.FacebookUrl).HasColumnType("NVARCHAR").HasMaxLength(500);
            builder.Property(x => x.TwitterUrl).HasColumnType("NVARCHAR").HasMaxLength(500);
            builder.Property(x => x.InstagramUrl).HasColumnType("NVARCHAR").HasMaxLength(500);
            builder.Property(x => x.LinkedInUrl).HasColumnType("NVARCHAR").HasMaxLength(500);
            builder.Property(x => x.ModifiedDateTime).HasColumnType("DATETIME2").HasColumnName("ModifiedDateTime");
            builder.Property(x => x.CreatedDateTime).HasColumnType("DATETIME2").HasColumnName("CreatedDateTime");
        }
    }
}
