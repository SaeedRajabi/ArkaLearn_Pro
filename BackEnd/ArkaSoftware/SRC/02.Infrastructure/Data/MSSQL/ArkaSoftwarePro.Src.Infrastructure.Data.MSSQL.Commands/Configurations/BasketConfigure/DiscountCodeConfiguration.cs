using ArkaSoftwarePro.Src.Core.Domain.BasketAggregate.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace ArkaSoftwarePro.Src.Infrastructure.Data.MSSQL.Commands.Configurations.BasketConfigure;

public class DiscountCodeConfiguration : IEntityTypeConfiguration<DiscountCode>
{
    public void Configure(EntityTypeBuilder<DiscountCode> builder)
    {
        builder.ToTable("DiscountCodes", "Basket");

        builder.OwnsOne(x => x.Discount, discount =>
        {
            discount.Property(av => av.Amount)
                .HasColumnName("Discount_Amount")
                .HasColumnType("DECIMAL(18,0)")
                .IsRequired();
            discount.Property(av => av.Type)
                .HasColumnName("Discount_Type")
                .HasColumnType("VARCHAR")
                .HasMaxLength(20)
                .IsRequired();
            discount.Property(x => x.Code)
                .HasColumnName("Discount_Code")
                .HasColumnType("VARCHAR")
                .HasMaxLength(32);
        });

        builder.Property(x => x.ScopeType)
            .HasColumnType("tinyint")
            .IsRequired();

        builder.Property(x => x.TeacherId).IsRequired(false);
        builder.Property(x => x.StudentUserId).IsRequired(false);
        builder.Property(x => x.IsManuallyDisabled).IsRequired().HasDefaultValue(false);
        builder.Property(x => x.Title)
            .HasColumnType("NVARCHAR")
            .HasMaxLength(200)
            .IsRequired(false);

        builder.HasMany(x => x.CourseTargets)
            .WithOne()
            .HasForeignKey(x => x.DiscountCodeId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.Navigation(x => x.CourseTargets)
            .HasField("_courseTargets")
            .UsePropertyAccessMode(PropertyAccessMode.Field);
    }
}

public class DiscountCodeCourseTargetConfiguration : IEntityTypeConfiguration<DiscountCodeCourseTarget>
{
    public void Configure(EntityTypeBuilder<DiscountCodeCourseTarget> builder)
    {
        builder.ToTable("DiscountCodeCourses", "Basket");
        builder.Property(x => x.CourseId).IsRequired();
        builder.HasIndex(x => new { x.DiscountCodeId, x.CourseId }).IsUnique();
    }
}
