using ArkaSoftwarePro.Src.Core.Domain.DashboardAggregate.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace ArkaSoftwarePro.Src.Infrastructure.Data.MSSQL.Commands.Dashboard.Configs;

public class AdminAnnouncementConfig : IEntityTypeConfiguration<AdminAnnouncement>
{
    public void Configure(EntityTypeBuilder<AdminAnnouncement> builder)
    {
        builder.ToTable("AdminAnnouncements");
        builder.HasKey(x => x.Id);
        builder.Property(x => x.Title).HasMaxLength(300).IsRequired();
        builder.Property(x => x.Body).HasColumnType("NVARCHAR(MAX)").IsRequired();
        builder.Property(x => x.Priority).IsRequired();
        builder.Property(x => x.IsActive).IsRequired();
        builder.Property(x => x.ExpiresUtc).IsRequired(false);
    }
}
