using ArkaSoftwarePro.Src.Core.Domain.CoursesAggregate.Entities;
using ArkaSoftwarePro.Src.Core.Domain.CoursesAggregate.ValueOBJs;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace ArkaSoftwarePro.Src.Infrastructure.Data.MSSQL.Commands.Configurations.CoursesConfigure
{
    public class CourseSectionConfiguration : IEntityTypeConfiguration<CourseSection>
    {
        public void Configure(EntityTypeBuilder<CourseSection> builder)
        {
            builder.ToTable("CourseSection", "Course");
            builder.Property(x => x.SessionTitle).HasMaxLength(500).HasConversion(x => x!.Value, x => new Title(x!)).IsRequired();
            builder.HasIndex(x => x.SessionTitle);


            builder.HasOne(x => x.Course).WithMany(x => x.CourseSessions).HasForeignKey(x => x.CourseId).OnDelete(DeleteBehavior.Cascade);

            builder.HasMany(x => x.CourseLessons).WithOne(x => x.CourseSection).HasForeignKey(x => x.CourseSectionId).OnDelete(DeleteBehavior.Cascade);
        }
    }
}
