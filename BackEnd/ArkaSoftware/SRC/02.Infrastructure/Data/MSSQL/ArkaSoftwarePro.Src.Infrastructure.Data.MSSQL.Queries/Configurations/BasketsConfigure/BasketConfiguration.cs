using ArkaSoftwarePro.Src.Core.Domain.BasketAggregate.Entities;
using ArkaSoftwarePro.Src.Infrastructure.Data.MSSQL.Queries.Entities.Baskets;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace ArkaSoftwarePro.Src.Infrastructure.Data.MSSQL.Queries.Configurations.BasketsConfigure
{
    public class BasketConfiguration:IEntityTypeConfiguration<BasketQueryModel>
    {
        public void Configure(EntityTypeBuilder<BasketQueryModel> builder)
        {
            builder.ToTable("Baskets", "Basket");
            builder.HasKey(x => x.BasketId);
            builder.Property(x => x.BasketId).HasColumnName("Id").HasColumnType("BIGINT");

            builder.HasOne(x => x.DiscountCode)
                .WithMany()
                .HasForeignKey(x => x.DiscountCodeId)
                .HasConstraintName("FK_Baskets_DiscountCodes_DiscountCodeId");

            builder.HasMany(x => x.BasketItems)
                .WithOne(x => x.Basket).HasForeignKey(x => x.BasketId)
                .HasConstraintName("FK_BasketItems_Baskets_BasketId");

        }
    }
}
