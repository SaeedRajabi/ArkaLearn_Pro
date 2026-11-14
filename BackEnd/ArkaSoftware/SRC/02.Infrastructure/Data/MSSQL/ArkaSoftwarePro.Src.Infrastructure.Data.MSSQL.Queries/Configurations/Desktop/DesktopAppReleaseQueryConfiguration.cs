using ArkaSoftwarePro.Src.Infrastructure.Data.MSSQL.Queries.Entities.Desktop;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace ArkaSoftwarePro.Src.Infrastructure.Data.MSSQL.Queries.Configurations.Desktop;

public class DesktopAppReleaseQueryConfiguration : IEntityTypeConfiguration<DesktopAppReleaseQueryModel>
{
    public void Configure(EntityTypeBuilder<DesktopAppReleaseQueryModel> builder)
    {
        builder.ToTable("DesktopAppReleases", "Desktop");
        builder.HasKey(x => x.Id);
        builder.Property(x => x.Version).HasMaxLength(32);
        builder.Property(x => x.InstallerUrl).HasMaxLength(500);
        builder.Property(x => x.ReleaseNotes).HasMaxLength(4000);
        builder.Property(x => x.MinSupportedVersion).HasMaxLength(32);
        builder.Property(x => x.IsDelete).HasColumnName("IsDeleted");
    }
}
