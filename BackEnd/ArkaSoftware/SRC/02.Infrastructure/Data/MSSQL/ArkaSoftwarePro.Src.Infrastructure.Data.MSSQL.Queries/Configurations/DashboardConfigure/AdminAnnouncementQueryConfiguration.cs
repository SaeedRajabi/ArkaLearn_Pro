using ArkaSoftwarePro.Src.Infrastructure.Data.MSSQL.Queries.Entities.Dashboard;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace ArkaSoftwarePro.Src.Infrastructure.Data.MSSQL.Queries.Configurations.DashboardConfigure;

public class AdminAnnouncementQueryConfiguration : IEntityTypeConfiguration<AdminAnnouncementQueryModel>
{
    public void Configure(EntityTypeBuilder<AdminAnnouncementQueryModel> builder)
    {
        builder.ToTable("AdminAnnouncements");
        builder.HasKey(x => x.Id);
    }
}
