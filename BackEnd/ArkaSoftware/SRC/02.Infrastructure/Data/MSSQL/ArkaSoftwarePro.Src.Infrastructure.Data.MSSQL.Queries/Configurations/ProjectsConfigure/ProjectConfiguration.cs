using ArkaSoftwarePro.Src.Infrastructure.Data.MSSQL.Queries.Entities.Projects;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace ArkaSoftwarePro.Src.Infrastructure.Data.MSSQL.Queries.Configurations.ProjectsConfigure;

public class ProjectConfiguration : IEntityTypeConfiguration<ProjectQueryModel>
{
    public void Configure(EntityTypeBuilder<ProjectQueryModel> builder)
    {
        builder.ToTable("Projects", "Project");
        builder.HasKey(x => x.Id);
        builder.Property(x => x.Title).HasMaxLength(200);
        builder.Property(x => x.Slug).HasMaxLength(250);
        builder.Property(x => x.ShortDescription).HasMaxLength(500);
        builder.Property(x => x.LongDescription);
        builder.Property(x => x.ThumbnailUrl).HasMaxLength(500);
        builder.Property(x => x.IntroVideoUrl).HasMaxLength(500);
        builder.Property(x => x.GitHubUrl).HasMaxLength(500);
        builder.Property(x => x.ProjectUrl).HasMaxLength(500);
        builder.Property(x => x.TechnologiesJson).HasMaxLength(4000);
        builder.Property(x => x.GalleryJson);
        builder.HasOne(x => x.AuthorUser).WithMany().HasForeignKey(x => x.AuthorUserId).OnDelete(DeleteBehavior.Restrict);
        builder.HasMany(x => x.Tags).WithOne(x => x.Project).HasForeignKey(x => x.ProjectId).OnDelete(DeleteBehavior.SetNull);
    }
}
