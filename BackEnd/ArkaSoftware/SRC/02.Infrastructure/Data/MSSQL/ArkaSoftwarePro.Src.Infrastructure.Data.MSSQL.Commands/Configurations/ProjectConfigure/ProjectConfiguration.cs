using ArkaSoftwarePro.Src.Core.Domain.ArticleAggregate.ValueOBJs;
using ArkaSoftwarePro.Src.Core.Domain.ProjectAggregate.Entities;
using ArkaSoftwarePro.Src.Core.Domain.ProjectAggregate.ValueOBJs;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace ArkaSoftwarePro.Src.Infrastructure.Data.MSSQL.Commands.Configurations.ProjectConfigure;

public class ProjectConfiguration : IEntityTypeConfiguration<Project>
{
    public void Configure(EntityTypeBuilder<Project> builder)
    {
        builder.ToTable("Projects", "Project");
        builder.Property(x => x.Title).HasMaxLength(200)
            .HasConversion(x => x!.Value, x => new ProjectTitle(x)).IsRequired();
        builder.Property(x => x.ShortDescription).HasMaxLength(500)
            .HasConversion(x => x!.Value, x => new ProjectShortDescription(x));
        builder.Property(x => x.LongDescription).HasMaxLength(int.MaxValue)
            .HasConversion(x => x!.Value, x => new ProjectLongDescription(x));
        builder.Property(x => x.Slug).HasMaxLength(250)
            .HasConversion(x => x!.Value, x => new Slug(x)).IsRequired();
        builder.Property(x => x.ThumbnailUrl).HasMaxLength(500);
        builder.Property(x => x.IntroVideoUrl).HasMaxLength(500);
        builder.Property(x => x.GitHubUrl).HasMaxLength(500);
        builder.Property(x => x.ProjectUrl).HasMaxLength(500);
        builder.Property(x => x.TechnologiesJson).HasMaxLength(4000);
        builder.Property(x => x.GalleryJson).HasMaxLength(int.MaxValue);
        builder.Property(x => x.AuthorUserId).IsRequired();
        builder.Property(x => x.SeoTitle).HasMaxLength(200);
        builder.Property(x => x.MetaDescription).HasMaxLength(320);
        builder.Property(x => x.OgImageUrl).HasMaxLength(500);
        builder.HasIndex(x => x.Slug).IsUnique();
        builder.HasIndex(x => x.AuthorUserId);
        builder.HasMany(x => x.Tags).WithOne().HasForeignKey("ProjectId").OnDelete(DeleteBehavior.SetNull);
    }
}
