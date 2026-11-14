using ArkaSoftwarePro.Src.Infrastructure.Data.MSSQL.Queries.Entities.Courses;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace ArkaSoftwarePro.Src.Infrastructure.Data.MSSQL.Queries.Configurations.CoursesConfigure;

public class CourseLessonWatchProgressQueryConfiguration : IEntityTypeConfiguration<CourseLessonWatchProgressQueryModel>
{
    public void Configure(EntityTypeBuilder<CourseLessonWatchProgressQueryModel> builder)
    {
        builder.ToTable("CourseLessonWatchProgress", "Course");
        builder.HasKey(x => x.Id);
    }
}
