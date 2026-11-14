using ArkaSoftwarePro.Src.Core.Domain.EmailTemplateAggregate.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace ArkaSoftwarePro.Src.Infrastructure.Data.MSSQL.Commands.Configurations.EmailTemplateConfigure;

public class EmailTemplateConfiguration : IEntityTypeConfiguration<EmailTemplate>
{
    public void Configure(EntityTypeBuilder<EmailTemplate> builder)
    {
        builder.ToTable("EmailTemplates", "Website");
        builder.HasKey(x => x.Id);
        builder.HasIndex(x => x.TemplateKey).IsUnique();

        builder.Property(x => x.TemplateKey).HasColumnType("NVARCHAR").HasMaxLength(100).IsRequired();
        builder.Property(x => x.DisplayName).HasColumnType("NVARCHAR").HasMaxLength(200).IsRequired();
        builder.Property(x => x.Description).HasColumnType("NVARCHAR").HasMaxLength(1000).IsRequired();
        builder.Property(x => x.Subject).HasColumnType("NVARCHAR").HasMaxLength(500).IsRequired();
        builder.Property(x => x.BodyHtml).HasColumnType("NVARCHAR(MAX)").IsRequired();
        builder.Property(x => x.IsDelete).HasColumnType("bit");
    }
}
