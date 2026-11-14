using ArkaSoftwarePro.Src.Infrastructure.Data.MSSQL.Queries.Entities.Baskets;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace ArkaSoftwarePro.Src.Infrastructure.Data.MSSQL.Queries.Configurations.BasketsConfigure;

public class BasketItemConfiguration : IEntityTypeConfiguration<BasketItemQueryModel>
{
    public void Configure(EntityTypeBuilder<BasketItemQueryModel> builder)
    {
        builder.ToTable("BasketItems", "Basket");
        builder.HasKey(x => x.BasketItemId);
        builder.Property(x => x.BasketItemId).HasColumnName("Id").HasColumnType("BIGINT");
        builder.Property(x => x.Quantity).HasColumnName("Quantity").HasColumnType("INT");
        builder.Property(x => x.BasketId).HasColumnName("BasketId").HasColumnType("BIGINT");
        builder.HasOne(x => x.Course)
            .WithOne(x => x.BasketItem)
            .HasForeignKey<BasketItemQueryModel>(x => x.CourseId)
            .HasConstraintName("FK_BasketItems_Courses_CourseId");


    }
}