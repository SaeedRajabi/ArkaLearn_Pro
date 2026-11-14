using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using ArkaSoftwarePro.Src.Core.Domain.UsersAggregate.Entities;

namespace ArkaSoftwarePro.Src.Infrastructure.Data.MSSQL.Commands.Configurations.UsersConfigure
{
    public class IPBlackListConfiguration : IEntityTypeConfiguration<IPBlacklist>
    {
        public void Configure(EntityTypeBuilder<IPBlacklist> builder)
        {
            builder.ToTable("IPBlacklists", "User");
            builder.OwnsOne(x => x.UserEnvironmentInfo, environmentInfo =>
            {
                environmentInfo.Property(info => info.IPAddress).HasColumnName("IPAddress").HasColumnType("VARCHAR").HasMaxLength(20).IsRequired();
                environmentInfo.Property(info => info.DeviceInfo).HasColumnName("DeviceInformation").HasColumnType("VARCHAR").HasMaxLength(200).IsRequired();
            });

            builder.Property(x => x.Reason).HasColumnType("NVARCHAR").HasMaxLength(300).IsRequired(false);
        }
    }
}
