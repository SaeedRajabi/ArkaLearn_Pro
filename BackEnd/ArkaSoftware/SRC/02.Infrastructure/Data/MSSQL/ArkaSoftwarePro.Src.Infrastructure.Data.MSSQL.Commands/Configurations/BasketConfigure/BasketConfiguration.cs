using ArkaSoftwarePro.Src.Core.Domain.BasketAggregate.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace ArkaSoftwarePro.Src.Infrastructure.Data.MSSQL.Commands.Configurations.BasketConfigure
{
    public class BasketConfiguration:IEntityTypeConfiguration<Basket>
    {
        public void Configure(EntityTypeBuilder<Basket> builder)
        {
            builder.ToTable("Baskets", "Basket");
            builder.HasMany(x => x.Items).WithOne();
            builder.HasOne(x => x.DiscountCode).WithMany();
        }
    }
}
