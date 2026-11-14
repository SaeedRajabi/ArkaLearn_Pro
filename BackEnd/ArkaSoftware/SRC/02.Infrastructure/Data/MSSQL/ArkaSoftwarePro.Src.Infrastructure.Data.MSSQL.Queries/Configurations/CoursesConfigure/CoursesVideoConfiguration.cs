using ArkaSoftwarePro.Src.Infrastructure.Data.MSSQL.Queries.Entities.Courses;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace ArkaSoftwarePro.Src.Infrastructure.Data.MSSQL.Queries.Configurations.CoursesConfigure;

public class CoursesVideoConfiguration : IEntityTypeConfiguration<CourseVideoQueryModel>
{
    public void Configure(EntityTypeBuilder<CourseVideoQueryModel> builder)
    {
        builder.ToTable("Videos", "Course");
        builder.HasKey(x => x.Id).HasName("Id");
        builder.Property(x => x.Id).HasColumnName("Id");
        builder.Property(x => x.Title).HasColumnName("Title").HasMaxLength(100);
        builder.Property(x => x.VideoPath).HasColumnName("VideoPath").HasMaxLength(500);
        builder.Property(x => x.Duration).HasColumnName("Duration").HasColumnType("TIME").HasMaxLength(7);

        builder.HasOne(x => x.Course)
            .WithMany(x => x.Videos)
            .HasForeignKey(x => x.CourseId)
            .OnDelete(DeleteBehavior.Cascade);

    }
}