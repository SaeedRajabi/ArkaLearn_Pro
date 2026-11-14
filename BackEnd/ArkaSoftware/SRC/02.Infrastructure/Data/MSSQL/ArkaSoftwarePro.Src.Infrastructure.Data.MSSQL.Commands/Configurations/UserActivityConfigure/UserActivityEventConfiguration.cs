using ArkaSoftwarePro.Src.Core.Domain.UserActivityAggregate.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace ArkaSoftwarePro.Src.Infrastructure.Data.MSSQL.Commands.Configurations.UserActivityConfigure;

public class UserActivityEventConfiguration : IEntityTypeConfiguration<UserActivityEvent>
{
    public void Configure(EntityTypeBuilder<UserActivityEvent> builder)
    {
        builder.ToTable("UserActivityEvents", "Analytics");
        builder.HasKey(x => x.Id);
        builder.Property(x => x.VisitorKey).HasMaxLength(128);
        builder.Property(x => x.SubjectKey).HasMaxLength(160).IsRequired();
        builder.Property(x => x.ActionType).HasMaxLength(64).IsRequired();
        builder.Property(x => x.ActionTitle).HasMaxLength(512);
        builder.Property(x => x.PagePath).HasMaxLength(1024);
        builder.Property(x => x.PageTitle).HasMaxLength(512);
        builder.Property(x => x.Referrer).HasMaxLength(1024);
        builder.Property(x => x.SiteSource).HasMaxLength(32);
        builder.Property(x => x.IpAddressV4).HasMaxLength(64);
        builder.Property(x => x.IpAddressV6).HasMaxLength(128);
        builder.Property(x => x.UserAgent).HasMaxLength(1024);
        builder.Property(x => x.BrowserName).HasMaxLength(64);
        builder.Property(x => x.BrowserVersion).HasMaxLength(32);
        builder.Property(x => x.OperatingSystem).HasMaxLength(128);
        builder.Property(x => x.DeviceType).HasMaxLength(32);
        builder.Property(x => x.DisplayName).HasMaxLength(256);
        builder.Property(x => x.MetadataJson).HasColumnType("nvarchar(max)");
        builder.Property(x => x.IsDelete).HasColumnType("bit");
        builder.HasIndex(x => x.SubjectKey);
        builder.HasIndex(x => x.OccurredAtUtc);
        builder.HasIndex(x => new { x.SubjectKey, x.OccurredAtUtc });
    }
}
