using ArkaSoftwarePro.Src.Infrastructure.Data.MSSQL.Queries.Entities.Courses;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace ArkaSoftwarePro.Src.Infrastructure.Data.MSSQL.Queries.Configurations.CoursesConfigure;

public class CourseSectionConfiguration : IEntityTypeConfiguration<CourseSectionQueryModel>
{
    public void Configure(EntityTypeBuilder<CourseSectionQueryModel> builder)
    {
        builder.ToTable("CourseSection", "Course").HasKey(x => x.Id).HasName("Id");
        builder.Property(x => x.SessionName)
            .HasColumnName("SessionTitle")
            .HasColumnType("NVARCHAR")
            .HasMaxLength(500)
            .IsRequired(false);

        builder.HasMany(x => x.Lessons)
            .WithOne(x => x.CourseSection).HasForeignKey(x => x.CourseSectionId)
            .HasConstraintName("FK_CourseLesson_CourseSection_CourseSectionId");
    }
}