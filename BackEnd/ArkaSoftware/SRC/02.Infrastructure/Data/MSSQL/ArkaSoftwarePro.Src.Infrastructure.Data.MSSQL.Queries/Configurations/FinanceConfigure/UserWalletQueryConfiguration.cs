using ArkaSoftwarePro.Src.Infrastructure.Data.MSSQL.Queries.Entities.Finance;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace ArkaSoftwarePro.Src.Infrastructure.Data.MSSQL.Queries.Configurations.FinanceConfigure;

public class UserWalletQueryConfiguration : IEntityTypeConfiguration<UserWalletQueryModel>
{
    public void Configure(EntityTypeBuilder<UserWalletQueryModel> builder)
    {
        builder.ToTable("UserWallets", "Finance");
        builder.HasKey(x => x.Id);
        builder.Property(x => x.UserId).HasColumnName("UserId");
        builder.Property(x => x.IsPlatformWallet).HasColumnName("IsPlatformWallet");
        builder.Property(x => x.AvailableBalanceToman).HasColumnName("AvailableBalanceToman");
    }
}
