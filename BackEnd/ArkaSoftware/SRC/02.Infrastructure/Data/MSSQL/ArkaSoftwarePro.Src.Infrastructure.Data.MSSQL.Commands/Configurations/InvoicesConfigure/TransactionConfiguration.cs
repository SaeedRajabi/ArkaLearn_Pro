using ArkaSoftwarePro.Src.Core.Domain.InvoiceAggregate.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace ArkaSoftwarePro.Src.Infrastructure.Data.MSSQL.Commands.Configurations.InvoicesConfigure
{
    public class TransactionConfiguration : IEntityTypeConfiguration<Transaction>
    {
        public void Configure(EntityTypeBuilder<Transaction> builder)
        {
            builder.ToTable("Transactions", "Order");

            builder.Property(x => x.TransactionDate).HasColumnType("DATETIME2");
            builder.Property(x => x.Amount).HasColumnType("DECIMAL(18,0)");
            builder.Property(x => x.Status).HasColumnType("TINYINT");
            builder.Property(x => x.ReferenceNumber).HasColumnType("VARCHAR(100)");
            builder.Property(x => x.Description).HasColumnType("NVARCHAR(500)");
            builder.Property(x => x.InvoiceId).IsRequired(false);
            builder.Property(x => x.PaymentId).IsRequired(false);

            builder.OwnsOne(x => x.TransactionNumber, trxNum =>
            {
                trxNum.Property(v => v.Value).HasColumnName("TransactionNumber").HasColumnType("VARCHAR(100)").IsRequired();
            });
        }
    }
}
