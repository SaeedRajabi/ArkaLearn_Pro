using ArkaSoftwarePro.Src.Core.Domain.CategoryAggregate.Entities;
using ArkaSoftwarePro.Src.Core.Domain.CategoryAggregate.ValueOBJs;
using Framework.Src.Core.Domain.ValueOBJs;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace ArkaSoftwarePro.Src.Infrastructure.Data.MSSQL.Commands.Configurations.CategoriesConfigure
{
    public class CategoryCommandConfiguration : IEntityTypeConfiguration<Category>
    {
        public void Configure(EntityTypeBuilder<Category> builder)
        {
            builder.ToTable("Categories", "Category");
            builder.Property(x => x.Title)
                .HasConversion(x => x!.Value, x => new CategoryTitleVo(x!))
                .HasColumnName("CategoryName")
                .HasMaxLength(150)
                .HasColumnType("NVARCHAR")
                .IsRequired(true);

            builder.Property(x => x.Description)
                .HasConversion(x => x!.Value, x => new Description(x!))
                .HasColumnName("CategoryDescription")
                .HasMaxLength(800)
                .HasColumnType("NVARCHAR")
                .IsRequired(false);

            builder.Property(x => x.CategoryImage)
                .HasConversion(x => x!.ImageURL, x => new Image(x!))
                .HasColumnName("CategoryImage")
                .HasMaxLength(500)
                .HasColumnType("NVARCHAR")
                .IsRequired(true);
        }
    }
}
