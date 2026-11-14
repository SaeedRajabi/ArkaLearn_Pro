using ArkaSoftwarePro.Src.Infrastructure.Data.MSSQL.Queries.Entities.UserNotifications;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace ArkaSoftwarePro.Src.Infrastructure.Data.MSSQL.Queries.Configurations.UserNotificationsConfigure;

public class UserNotificationQueryConfiguration : IEntityTypeConfiguration<UserNotificationQueryModel>
{
    public void Configure(EntityTypeBuilder<UserNotificationQueryModel> builder)
    {
        builder.ToTable("UserNotifications", "Notification");
        builder.HasKey(x => x.Id);
    }
}
