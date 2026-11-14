using ArkaSoftwarePro.Src.Infrastructure.Data.MSSQL.Queries.Entities.Baskets;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace ArkaSoftwarePro.Src.Infrastructure.Data.MSSQL.Queries.Configurations.BasketsConfigure;

public class DiscountCodeConfiguration : IEntityTypeConfiguration<DiscountCodeQueryModel>
{
    public void Configure(EntityTypeBuilder<DiscountCodeQueryModel> builder)
    {
        builder.ToTable("DiscountCodes", "Basket");
        builder.HasKey(x => x.DiscountCodeId);
        builder.Property(x => x.DiscountCodeId).HasColumnName("Id").HasColumnType("BIGINT");
        builder.Property(x => x.DiscountType).HasColumnName("Discount_Type").HasColumnType("VARCHAR").HasMaxLength(20);
        builder.Property(x => x.DiscountAmount).HasColumnName("Discount_Amount").HasColumnType("DECIMAL(18,0)");
        builder.Property(x => x.ExpirationDate).HasColumnName("ExpirationDate").HasColumnType("DATETIME2");
        builder.Property(x => x.DiscountCodeIsActive).HasColumnName("IsActive").HasColumnType("BIT");
        builder.Property(x => x.Code).HasColumnName("Discount_Code").HasColumnType("VARCHAR").HasMaxLength(32);
        builder.Property(x => x.ScopeType).HasColumnName("ScopeType").HasColumnType("tinyint");
        builder.Property(x => x.TeacherId).HasColumnName("TeacherId");
        builder.Property(x => x.StudentUserId).HasColumnName("StudentUserId");
        builder.Property(x => x.Title).HasColumnName("Title").HasMaxLength(200);
        builder.Property(x => x.UsageLimit).HasColumnName("UsageLimit");
        builder.Property(x => x.UsedCount).HasColumnName("UsedCount");
    }
}
