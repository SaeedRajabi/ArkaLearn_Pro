using ArkaSoftwarePro.Src.Infrastructure.Data.MSSQL.Queries.Entities.Users;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace ArkaSoftwarePro.Src.Infrastructure.Data.MSSQL.Queries.Configurations.UsersConfigure;

public class IPBlacklistQueryConfiguration : IEntityTypeConfiguration<IPBlacklistQueryModel>
{
    public void Configure(EntityTypeBuilder<IPBlacklistQueryModel> builder)
    {
        builder.ToTable("IPBlacklists", "User");
        builder.HasKey(x => x.Id);
        builder.Property(x => x.IPAddress).HasColumnName("IPAddress").HasColumnType("VARCHAR(20)");
        builder.Property(x => x.DeviceInformation).HasColumnName("DeviceInformation").HasColumnType("VARCHAR(200)");
        builder.Property(x => x.Reason).HasColumnType("NVARCHAR(300)");
    }
}
