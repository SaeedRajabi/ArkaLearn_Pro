using ArkaSoftwarePro.Src.Infrastructure.Data.MSSQL.Queries.Entities.Orders;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace ArkaSoftwarePro.Src.Infrastructure.Data.MSSQL.Queries.Configurations.OrdersConfigure
{
    public class OrderConfiguration:IEntityTypeConfiguration<OrderQueryModel>
    {
        public void Configure(EntityTypeBuilder<OrderQueryModel> builder)
        {
            builder.ToTable("Orders", "Order");
            builder.HasKey(x => x.OrderId);
            builder.Property(x => x.OrderId).HasColumnName("Id");
            builder.Property(x => x.OrderStatus).HasColumnType("TINYINT").HasColumnName("Status");
            builder.Property(x => x.CreateDateTime).HasColumnName("CreatedDateTime");
            builder.HasOne(x => x.Student).WithMany(x => x.Orders).HasForeignKey(x => x.StudentId).OnDelete(DeleteBehavior.Cascade);
            builder.HasMany(x => x.OrderItems).WithOne().HasForeignKey(x => x.OrderId).OnDelete(DeleteBehavior.Cascade);
        }
    }
}
