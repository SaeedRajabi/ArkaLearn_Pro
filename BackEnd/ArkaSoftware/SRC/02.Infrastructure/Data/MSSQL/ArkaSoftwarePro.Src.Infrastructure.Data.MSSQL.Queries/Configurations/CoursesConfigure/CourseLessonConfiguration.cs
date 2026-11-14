using ArkaSoftwarePro.Src.Infrastructure.Data.MSSQL.Queries.Entities.Courses;
using ArkaSoftwarePro.Src.Core.Domain.TeacherAggregate.Enumerations;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace ArkaSoftwarePro.Src.Infrastructure.Data.MSSQL.Queries.Configurations.CoursesConfigure;

public class CourseLessonConfiguration : IEntityTypeConfiguration<CourseLessonQueryModel>
{
    public void Configure(EntityTypeBuilder<CourseLessonQueryModel> builder)
    {
        builder.ToTable("CourseLesson", "Course").HasKey(x => x.Id).HasName("Id");
        builder.Property(x => x.LessonTitle)
            .HasColumnName("LessonTitle")
            .HasColumnType("NVARCHAR").HasMaxLength(1000)
            .IsRequired(false);
        builder.Property(x => x.VideoTitle)
            .HasColumnName("VideoTitle")
            .HasColumnType("NVARCHAR").HasMaxLength(500)
            .IsRequired(false);
        builder.Property(x => x.VideoPath)
            .HasColumnName("VideoPath")
            .HasColumnType("NVARCHAR").HasMaxLength(500)
            .IsRequired(false);
        builder.Property(x => x.WatermarkedVideoPath)
            .HasColumnName("WatermarkedVideoPath")
            .HasColumnType("NVARCHAR").HasMaxLength(500)
            .IsRequired(false);
        builder.Property(x => x.DurationSeconds).HasColumnName("DurationSeconds");
        builder.Property(x => x.SortOrder).HasColumnName("SortOrder");
        builder.Property(x => x.IsPublished).HasColumnName("IsPublished");
        builder.Property(x => x.PublishedAtUtc).HasColumnName("PublishedAtUtc");
        builder.Property(x => x.VideoModerationStatus).HasColumnName("VideoModerationStatus");
        builder.Property(x => x.VideoRejectionNote).HasColumnName("VideoRejectionNote");
        builder.Property(x => x.MediaAssetId).HasColumnName("MediaAssetId");
    }
}
