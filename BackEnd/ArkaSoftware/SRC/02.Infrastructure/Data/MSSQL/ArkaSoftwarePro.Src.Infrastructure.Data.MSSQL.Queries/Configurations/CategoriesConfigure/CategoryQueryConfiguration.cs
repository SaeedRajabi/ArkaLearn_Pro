using ArkaSoftwarePro.Src.Infrastructure.Data.MSSQL.Queries.Entities.Categories;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace ArkaSoftwarePro.Src.Infrastructure.Data.MSSQL.Queries.Configurations.CategoriesConfigure
{
    public class CategoryQueryConfiguration : IEntityTypeConfiguration<CategoryQueryModel>
    {
        public void Configure(EntityTypeBuilder<CategoryQueryModel> builder)
        {
            builder.ToTable("Categories", "Category");
            builder.HasKey(x => x.Id);
            builder.Property(x => x.Title).HasColumnName("CategoryName").HasColumnType("NVARCHAR").HasMaxLength(150);
            builder.Property(x => x.CategoryImage).HasColumnName("CategoryImage").HasColumnType("NVARCHAR").HasMaxLength(500);
            builder.Property(x => x.BusinessId).HasColumnName("BusinessId");


            builder.Property(x => x.CategoryDescription)
                .HasColumnName("CategoryDescription")
                .HasMaxLength(800)
                .HasColumnType("NVARCHAR")
                .IsRequired(false);
            builder.Property(x => x.CreateAt).HasColumnType("DATETIME2").HasColumnName("CreatedDateTime");

            builder.HasOne(x => x.Parent)
                .WithMany(x => x.Children)
                .HasForeignKey(x => x.ParentId)
                .OnDelete(DeleteBehavior.Restrict);


        }
    }
}
