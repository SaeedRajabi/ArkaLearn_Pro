using ArkaSoftwarePro.Src.Infrastructure.Data.MSSQL.Queries.Entities.SiteAnnouncement;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace ArkaSoftwarePro.Src.Infrastructure.Data.MSSQL.Queries.Configurations.SiteAnnouncementConfigure;

public class SiteAnnouncementQueryConfiguration : IEntityTypeConfiguration<SiteAnnouncementQueryModel>
{
    public void Configure(EntityTypeBuilder<SiteAnnouncementQueryModel> builder)
    {
        builder.ToTable("SiteAnnouncements", "Website");
    }
}
