using ArkaSoftwarePro.Src.Infrastructure.Data.MSSQL.Queries.Entities.Orders;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace ArkaSoftwarePro.Src.Infrastructure.Data.MSSQL.Queries.Configurations.OrdersConfigure;

public class OrderItemConfiguration : IEntityTypeConfiguration<OrderItemQueryModel>
{
    public void Configure(EntityTypeBuilder<OrderItemQueryModel> builder)
    {
        builder.ToTable("OrderItems", "Order");
        builder.HasKey(x => x.OrderItemId);
        builder.Property(x => x.OrderItemId).HasColumnName("Id");
        builder.Property(x => x.OrderId).HasColumnName("OrderId");
        builder.Property(x => x.Quantity).HasColumnName("Quantity");
        builder.Property(x => x.UnitPrice).HasColumnName("UnitPrice_Amount");
        builder.HasOne(x => x.Course).WithMany().HasForeignKey(x => x.CourseId).OnDelete(DeleteBehavior.Restrict);
    }
}