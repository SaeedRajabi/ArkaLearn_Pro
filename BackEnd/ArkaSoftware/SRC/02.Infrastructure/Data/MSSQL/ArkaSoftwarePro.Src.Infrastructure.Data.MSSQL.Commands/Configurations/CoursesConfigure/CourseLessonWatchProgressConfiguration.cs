using ArkaSoftwarePro.Src.Core.Domain.CoursesAggregate.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace ArkaSoftwarePro.Src.Infrastructure.Data.MSSQL.Commands.Configurations.CoursesConfigure;

public class CourseLessonWatchProgressConfiguration : IEntityTypeConfiguration<CourseLessonWatchProgress>
{
    public void Configure(EntityTypeBuilder<CourseLessonWatchProgress> builder)
    {
        builder.ToTable("CourseLessonWatchProgress", "Course");
        builder.HasIndex(x => new { x.UserId, x.LessonId }).IsUnique();
        builder.HasIndex(x => new { x.UserId, x.CourseId });
    }
}
