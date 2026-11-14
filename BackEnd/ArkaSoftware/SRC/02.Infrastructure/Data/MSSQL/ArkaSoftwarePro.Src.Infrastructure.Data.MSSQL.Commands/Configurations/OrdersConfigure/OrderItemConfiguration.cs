using ArkaSoftwarePro.Src.Core.Domain.OrderAggregate.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace ArkaSoftwarePro.Src.Infrastructure.Data.MSSQL.Commands.Configurations.OrdersConfigure;

public class OrderItemConfiguration : IEntityTypeConfiguration<OrderItem>
{
    public void Configure(EntityTypeBuilder<OrderItem> builder)
    {
        builder.ToTable("OrderItems", "Order");

        builder.OwnsOne(x => x.UnitPrice, price =>
        {
            price.Property(av => av.Amount).HasColumnName("UnitPrice_Amount").HasColumnType("DECIMAL(18,0)").IsRequired();
            price.Property(av => av.Currency).HasColumnName("UnitPrice_Currency").HasColumnType("VARCHAR").HasMaxLength(3).IsRequired();
        });
        
    }
}