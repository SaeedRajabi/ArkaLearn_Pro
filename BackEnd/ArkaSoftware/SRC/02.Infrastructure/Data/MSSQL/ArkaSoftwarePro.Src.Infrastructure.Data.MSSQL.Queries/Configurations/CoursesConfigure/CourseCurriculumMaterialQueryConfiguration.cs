using ArkaSoftwarePro.Src.Infrastructure.Data.MSSQL.Queries.Entities.Courses;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace ArkaSoftwarePro.Src.Infrastructure.Data.MSSQL.Queries.Configurations.CoursesConfigure;

public class CourseCurriculumMaterialQueryConfiguration
    : IEntityTypeConfiguration<CourseCurriculumMaterialQueryModel>
{
    public void Configure(EntityTypeBuilder<CourseCurriculumMaterialQueryModel> builder)
    {
        builder.ToTable("CurriculumMaterials", "Course");
        builder.HasKey(x => x.Id);
        builder.Property(x => x.DisplayName).HasMaxLength(260);
        builder.Property(x => x.IsDelete).HasColumnName("IsDelete");
    }
}
