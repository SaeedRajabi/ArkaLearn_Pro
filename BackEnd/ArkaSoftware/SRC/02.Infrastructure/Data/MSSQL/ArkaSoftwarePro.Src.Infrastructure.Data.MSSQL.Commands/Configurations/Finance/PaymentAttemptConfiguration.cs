using ArkaSoftwarePro.Src.Core.Domain.FinanceAggregate.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace ArkaSoftwarePro.Src.Infrastructure.Data.MSSQL.Commands.Configurations.Finance;

public sealed class PaymentAttemptConfiguration : IEntityTypeConfiguration<PaymentAttempt>
{
    public void Configure(EntityTypeBuilder<PaymentAttempt> builder)
    {
        builder.ToTable("PaymentAttempts", "Finance");
        builder.HasKey(x => x.OrderId);
        builder.Property(x => x.OrderId).HasMaxLength(200);
        builder.Property(x => x.Provider).HasMaxLength(32);
        builder.Property(x => x.PaymentId).HasMaxLength(200);
        builder.Property(x => x.ReferenceNumber).HasMaxLength(200);
        builder.Property(x => x.CardNumber).HasMaxLength(100);
        builder.Property(x => x.ResultUrl).HasMaxLength(4000);
        builder.HasIndex(x => new { x.Provider, x.PaymentId }).IsUnique().HasFilter("[PaymentId] IS NOT NULL");
        builder.HasIndex(x => new { x.Provider, x.ReferenceNumber }).IsUnique().HasFilter("[ReferenceNumber] IS NOT NULL");
    }
}
