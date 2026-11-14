using ArkaSoftwarePro.Src.Core.Domain.UserNotificationAggregate.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace ArkaSoftwarePro.Src.Infrastructure.Data.MSSQL.Commands.UserNotifications.Configs;

public class UserNotificationConfig : IEntityTypeConfiguration<UserNotification>
{
    public void Configure(EntityTypeBuilder<UserNotification> builder)
    {
        builder.ToTable("UserNotifications", "Notification");
        builder.HasKey(x => x.Id);
        builder.Property(x => x.UserId).IsRequired();
        builder.HasIndex(x => new { x.UserId, x.IsRead });
        builder.Property(x => x.Title).HasMaxLength(300).IsRequired();
        builder.Property(x => x.Body).HasMaxLength(2000).IsRequired();
        builder.Property(x => x.Type).HasMaxLength(100).IsRequired();
        builder.Property(x => x.LinkUrl).HasMaxLength(500);
    }
}
