using ArkaSoftwarePro.Src.Core.Domain.OrderAggregate.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace ArkaSoftwarePro.Src.Infrastructure.Data.MSSQL.Commands.Configurations.OrdersConfigure
{
    public class OrderConfiguration:IEntityTypeConfiguration<Order>
    {
        public void Configure(EntityTypeBuilder<Order> builder)
        {
            builder.ToTable("Orders", "Order");
            builder.Property(x => x.Status).HasColumnType("TINYINT");
            builder.HasOne(x => x.Student).WithMany(x => x.Orders).HasForeignKey(x => x.StudentId).OnDelete(DeleteBehavior.Cascade);
        }
    }
}
