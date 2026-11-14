using ArkaSoftwarePro.Src.Infrastructure.Data.MSSQL.Queries.Entities.Invoices;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace ArkaSoftwarePro.Src.Infrastructure.Data.MSSQL.Queries.Configurations.InvoicesConfigure
{
    public class InvoiceQueryConfiguration : IEntityTypeConfiguration<InvoiceQueryModel>
    {
        public void Configure(EntityTypeBuilder<InvoiceQueryModel> builder)
        {
            builder.ToTable("Invoices", "Order");
            builder.HasKey(x => x.Id);
            builder.Property(x => x.InvoiceNumber).HasColumnType("VARCHAR(50)");
            builder.Property(x => x.InvoiceDate).HasColumnType("DATETIME2");
            builder.Property(x => x.TotalAmount).HasColumnType("DECIMAL(18,0)");
            builder.Property(x => x.PaidAmount).HasColumnType("DECIMAL(18,0)");
            builder.Property(x => x.Status).HasColumnType("TINYINT");
            builder.Property(x => x.Description).HasColumnType("NVARCHAR(500)");
            builder.HasMany(x => x.Transactions)
                .WithOne()
                .HasForeignKey(x => x.InvoiceId)
                .OnDelete(DeleteBehavior.Cascade);
        }
    }
}
