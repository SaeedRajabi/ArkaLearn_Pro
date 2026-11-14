using ArkaSoftwarePro.Src.Core.Domain.BasketAggregate.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace ArkaSoftwarePro.Src.Infrastructure.Data.MSSQL.Commands.Configurations.BasketConfigure
{
    public class BasketItemConfiguration:IEntityTypeConfiguration<BasketItem>
    {
        public void Configure(EntityTypeBuilder<BasketItem> builder)
        {
            builder.ToTable("BasketItems", "Basket");

            builder.HasOne(x => x.Course).WithOne().HasForeignKey<BasketItem>(x => x.CourseId);

        }
    }
}
