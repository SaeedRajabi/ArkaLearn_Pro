using ArkaSoftwarePro.Src.Core.Domain.InvoiceAggregate.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace ArkaSoftwarePro.Src.Infrastructure.Data.MSSQL.Commands.Configurations.InvoicesConfigure
{
    public class InvoiceConfiguration : IEntityTypeConfiguration<Invoice>
    {
        public void Configure(EntityTypeBuilder<Invoice> builder)
        {
            builder.ToTable("Invoices", "Order");

            builder.Property(x => x.InvoiceDate).HasColumnType("DATETIME2");
            builder.Property(x => x.TotalAmount).HasColumnType("DECIMAL(18,0)");
            builder.Property(x => x.PaidAmount).HasColumnType("DECIMAL(18,0)");
            builder.Property(x => x.Status).HasColumnType("TINYINT");
            builder.Property(x => x.Description).HasColumnType("NVARCHAR(500)");
            builder.Property(x => x.OrderId).IsRequired();
            builder.Property(x => x.StudentId).IsRequired();

            builder.OwnsOne(x => x.InvoiceNumber, invNum =>
            {
                invNum.Property(v => v.Value).HasColumnName("InvoiceNumber").HasColumnType("VARCHAR(50)").IsRequired();
            });

            builder.HasMany(x => x.Transactions)
                .WithOne(t => t.Invoice)
                .HasForeignKey(t => t.InvoiceId)
                .OnDelete(DeleteBehavior.Cascade);

            builder.HasOne(x => x.Order)
                .WithMany()
                .HasForeignKey(x => x.OrderId)
                .OnDelete(DeleteBehavior.Restrict);

            builder.HasOne(x => x.Student)
                .WithMany()
                .HasForeignKey(x => x.StudentId)
                .OnDelete(DeleteBehavior.Restrict);
        }
    }
}
