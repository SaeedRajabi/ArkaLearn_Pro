using ArkaSoftwarePro.Src.Infrastructure.Data.MSSQL.Queries.Entities.Invoices;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace ArkaSoftwarePro.Src.Infrastructure.Data.MSSQL.Queries.Configurations.InvoicesConfigure
{
    public class TransactionQueryConfiguration : IEntityTypeConfiguration<TransactionQueryModel>
    {
        public void Configure(EntityTypeBuilder<TransactionQueryModel> builder)
        {
            builder.ToTable("Transactions", "Order");
            builder.HasKey(x => x.Id);
            builder.Property(x => x.TransactionNumber).HasColumnType("VARCHAR(100)");
            builder.Property(x => x.TransactionDate).HasColumnType("DATETIME2");
            builder.Property(x => x.Amount).HasColumnType("DECIMAL(18,0)");
            builder.Property(x => x.Status).HasColumnType("TINYINT");
            builder.Property(x => x.ReferenceNumber).HasColumnType("VARCHAR(100)");
            builder.Property(x => x.Description).HasColumnType("NVARCHAR(500)");
        }
    }
}
