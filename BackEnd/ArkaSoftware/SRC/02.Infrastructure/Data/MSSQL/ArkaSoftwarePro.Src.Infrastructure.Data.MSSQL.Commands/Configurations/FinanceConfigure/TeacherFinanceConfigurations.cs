using ArkaSoftwarePro.Src.Core.Domain.FinanceAggregate.Entities;
using ArkaSoftwarePro.Src.Core.Domain.FinanceAggregate.Enumerations;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace ArkaSoftwarePro.Src.Infrastructure.Data.MSSQL.Commands.Configurations.FinanceConfigure;

public class PlatformFinanceSettingsConfiguration : IEntityTypeConfiguration<PlatformFinanceSettings>
{
    public void Configure(EntityTypeBuilder<PlatformFinanceSettings> builder)
    {
        builder.ToTable("PlatformFinanceSettings", "Finance");
        builder.Property(x => x.TotalCentralBalanceToman).IsConcurrencyToken();

        builder.Property(x => x.IncomeTaxPercent).HasPrecision(5, 2);
        builder.Property(x => x.PlatformFeePercent).HasPrecision(5, 2);
        builder.Property(x => x.PlatformPayoutSheba).HasMaxLength(26);
        builder.Property(x => x.PlatformPayoutCardNumber).HasMaxLength(16);
        builder.Property(x => x.ZarinPalPlatformBankAccountId).HasMaxLength(64);
        builder.Property(x => x.PaymentGatewayProvider).HasMaxLength(32).HasDefaultValue("Zibal");
        builder.Property(x => x.PaymentGatewayEnabled).HasDefaultValue(true);
        builder.Property(x => x.ZibalMerchantIdEncrypted).HasMaxLength(512);
        builder.Property(x => x.ZibalApiKeyEncrypted).HasMaxLength(512);
        builder.Property(x => x.ZibalAccessTokenEncrypted).HasMaxLength(512);
        builder.Property(x => x.ZibalUseSandbox).HasDefaultValue(false);
        builder.Property(x => x.ZarinPalMerchantIdEncrypted).HasMaxLength(512);
        builder.Property(x => x.ZarinPalAccessTokenEncrypted).HasMaxLength(512);
        builder.Property(x => x.ZarinPalTerminalIdEncrypted).HasMaxLength(512);
        builder.Property(x => x.ZarinPalUseSandbox).HasDefaultValue(false);
    }
}

public class TeacherWalletConfiguration : IEntityTypeConfiguration<TeacherWallet>
{
    public void Configure(EntityTypeBuilder<TeacherWallet> builder)
    {
        builder.ToTable("TeacherWallets", "Finance");
        builder.Property(x => x.AvailableBalanceToman).IsConcurrencyToken();
        builder.Property(x => x.ReservedBalanceToman).IsConcurrencyToken();
        builder.Property(x => x.TotalGrossSalesToman).IsConcurrencyToken();
        builder.Property(x => x.TotalTaxWithheldToman).IsConcurrencyToken();
        builder.Property(x => x.TotalPlatformFeeToman).IsConcurrencyToken();
        builder.Property(x => x.TotalNetEarnedToman).IsConcurrencyToken();
        builder.Property(x => x.TotalWithdrawnToman).IsConcurrencyToken();

        builder.HasIndex(x => x.TeacherId).IsUnique();
    }
}

public class TeacherCourseSaleConfiguration : IEntityTypeConfiguration<TeacherCourseSale>
{
    public void Configure(EntityTypeBuilder<TeacherCourseSale> builder)
    {
        builder.ToTable("TeacherCourseSales", "Finance");
        builder.Property(x => x.CourseTitle).HasMaxLength(300).IsRequired();
        builder.Property(x => x.PaymentReference).HasMaxLength(200).IsRequired();
        builder.HasIndex(x => x.PaymentReference).IsUnique();
        builder.HasIndex(x => new { x.TeacherId, x.SoldAtUtc });
    }
}

public class TeacherPayoutRequestConfiguration : IEntityTypeConfiguration<TeacherPayoutRequest>
{
    public void Configure(EntityTypeBuilder<TeacherPayoutRequest> builder)
    {
        builder.ToTable("TeacherPayoutRequests", "Finance");
        builder.Property(x => x.Status).HasConversion<int>();
        builder.Property(x => x.TeacherNote).HasMaxLength(500);
        builder.Property(x => x.AdminNote).HasMaxLength(500);
        builder.Property(x => x.TransferReference).HasMaxLength(200);
        builder.HasIndex(x => new { x.TeacherId, x.RequestedAtUtc });
    }
}

public class UserWalletConfiguration : IEntityTypeConfiguration<UserWallet>
{
    public void Configure(EntityTypeBuilder<UserWallet> builder)
    {
        builder.ToTable("UserWallets", "Finance");
        builder.Property(x => x.AvailableBalanceToman).IsConcurrencyToken();
        builder.Property(x => x.ReservedBalanceToman).IsConcurrencyToken();
        builder.Property(x => x.TotalDepositedToman).IsConcurrencyToken();
        builder.Property(x => x.TotalSpentToman).IsConcurrencyToken();
        builder.Property(x => x.TotalReceivedToman).IsConcurrencyToken();
        builder.Property(x => x.TotalWithdrawnToman).IsConcurrencyToken();

        builder.HasIndex(x => x.UserId).IsUnique();
        builder.Property(x => x.ZibalSubMerchantId).HasMaxLength(32);
    }
}

public class WalletTransactionConfiguration : IEntityTypeConfiguration<WalletTransaction>
{
    public void Configure(EntityTypeBuilder<WalletTransaction> builder)
    {
        builder.ToTable("WalletTransactions", "Finance");
        builder.Property(x => x.Type).HasConversion<int>();
        builder.Property(x => x.Reference).HasMaxLength(200).IsRequired();
        builder.Property(x => x.Description).HasMaxLength(500);
        builder.HasIndex(x => x.Reference).IsUnique();
        builder.HasIndex(x => new { x.UserId, x.CreatedAtUtc });
    }
}
