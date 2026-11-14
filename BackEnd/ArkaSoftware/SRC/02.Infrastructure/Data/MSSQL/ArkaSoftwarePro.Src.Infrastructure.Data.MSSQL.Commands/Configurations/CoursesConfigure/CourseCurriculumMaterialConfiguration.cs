using ArkaSoftwarePro.Src.Core.Domain.CoursesAggregate.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace ArkaSoftwarePro.Src.Infrastructure.Data.MSSQL.Commands.Configurations.CoursesConfigure;

public class CourseCurriculumMaterialConfiguration : IEntityTypeConfiguration<CourseCurriculumMaterial>
{
    public void Configure(EntityTypeBuilder<CourseCurriculumMaterial> builder)
    {
        builder.ToTable("CurriculumMaterials", "Course");
        builder.HasKey(x => x.Id);
        builder.Property(x => x.DisplayName).HasMaxLength(260).IsRequired();
        builder.HasIndex(x => new { x.CourseId, x.CourseSectionId, x.CourseLessonId });
        builder.HasIndex(x => x.MediaAssetId);
        builder.Property(x => x.IsDelete).IsRequired();
    }
}
