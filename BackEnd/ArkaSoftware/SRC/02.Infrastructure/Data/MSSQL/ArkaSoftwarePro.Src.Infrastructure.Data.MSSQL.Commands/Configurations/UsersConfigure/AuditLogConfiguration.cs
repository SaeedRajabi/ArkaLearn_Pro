using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using ArkaSoftwarePro.Src.Core.Domain.UsersAggregate.Entities;

namespace ArkaSoftwarePro.Src.Infrastructure.Data.MSSQL.Commands.Configurations.UsersConfigure
{
    public class AuditLogConfiguration : IEntityTypeConfiguration<AuditLog>
    {
        public void Configure(EntityTypeBuilder<AuditLog> builder)
        {
            builder.ToTable("AuditLogs", "User");

            builder.Property(x => x.Action).HasColumnType("VARCHAR").HasMaxLength(50).IsRequired();

            builder.OwnsOne(x => x.UserEnvironmentInfo, environmentInfo =>
            {
                environmentInfo.Property(info => info.IPAddress).HasColumnName("IPAddress").HasColumnType("CHAR").HasMaxLength(15).IsRequired();
                environmentInfo.Property(info => info.DeviceInfo).HasColumnName("DeviceInformation").HasColumnType("VARCHAR").HasMaxLength(250).IsRequired();
            });
        }
    }
}
