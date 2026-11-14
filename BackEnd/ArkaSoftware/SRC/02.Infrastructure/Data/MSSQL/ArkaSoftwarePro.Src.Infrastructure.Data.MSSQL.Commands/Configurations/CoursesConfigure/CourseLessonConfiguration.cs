using ArkaSoftwarePro.Src.Core.Domain.CoursesAggregate.Entities;
using ArkaSoftwarePro.Src.Core.Domain.CoursesAggregate.ValueOBJs;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace ArkaSoftwarePro.Src.Infrastructure.Data.MSSQL.Commands.Configurations.CoursesConfigure
{
    public class CourseLessonConfiguration : IEntityTypeConfiguration<CourseLesson>
    {
        public void Configure(EntityTypeBuilder<CourseLesson> builder)
        {
            builder.ToTable("CourseLesson", "Course");
            builder.Property(x => x.LessonTitle).HasMaxLength(1000).HasConversion(x => x!.Value, x => new Title(x!)).IsRequired();
            builder.Property(x => x.VideoTitle).HasMaxLength(500).HasConversion(
                x => x == null ? null : x.Value,
                x => string.IsNullOrWhiteSpace(x) ? null : new Title(x!));
            builder.Property(x => x.VideoPath).HasMaxLength(500).HasConversion(
                x => x == null ? null : x.Value,
                x => string.IsNullOrWhiteSpace(x) ? null : VideoURL.FromString(x!));
            builder.Property(x => x.WatermarkedVideoPath).HasMaxLength(500).HasConversion(
                x => x == null ? null : x.Value,
                x => string.IsNullOrWhiteSpace(x) ? null : VideoURL.FromString(x!));
            builder.Property(x => x.DurationSeconds).HasDefaultValue(0);
            builder.Property(x => x.MediaAssetId);
            builder.Property(x => x.SortOrder).HasDefaultValue(0);
            builder.Property(x => x.IsPublished).HasDefaultValue(false);
            builder.Property(x => x.PublishedAtUtc);
            builder.Property(x => x.VideoRejectionNote).HasMaxLength(2000);

            //builder.HasOne().WithMany(cs => cs.CourseLessons).HasForeignKey(cl => cl.CourseSectionId).OnDelete(DeleteBehavior.Cascade);


            builder.HasIndex(x => x.LessonTitle);

        }
    }
}
