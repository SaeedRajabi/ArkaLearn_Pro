using ArkaSoftwarePro.Src.Infrastructure.Data.MSSQL.Queries.Entities.EmailTemplates;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace ArkaSoftwarePro.Src.Infrastructure.Data.MSSQL.Queries.Configurations.EmailTemplateConfigure;

public class EmailTemplateQueryConfiguration : IEntityTypeConfiguration<EmailTemplateQueryModel>
{
    public void Configure(EntityTypeBuilder<EmailTemplateQueryModel> builder)
    {
        builder.ToTable("EmailTemplates", "Website");
        builder.HasKey(x => x.Id);
        builder.HasIndex(x => x.TemplateKey).IsUnique();
        builder.Property(x => x.TemplateKey).HasColumnType("NVARCHAR").HasMaxLength(100);
        builder.Property(x => x.DisplayName).HasColumnType("NVARCHAR").HasMaxLength(200);
        builder.Property(x => x.Description).HasColumnType("NVARCHAR").HasMaxLength(1000);
        builder.Property(x => x.Subject).HasColumnType("NVARCHAR").HasMaxLength(500);
        builder.Property(x => x.BodyHtml).HasColumnType("NVARCHAR(MAX)");
    }
}
