using ArkaSoftwarePro.Src.Core.Domain.CoursesAggregate.Entities;
using ArkaSoftwarePro.Src.Core.Domain.CoursesAggregate.ValueOBJs;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace ArkaSoftwarePro.Src.Infrastructure.Data.MSSQL.Commands.Configurations.CoursesConfigure
{
    public class CourseVideoConfiguration : IEntityTypeConfiguration<CourseVideo>
    {
        public void Configure(EntityTypeBuilder<CourseVideo> builder)
        {
            builder.ToTable("Videos", "Course");
            builder.Property(x => x.Title).HasMaxLength(100).HasConversion(x => x!.Value, x => new Title(x!));
            builder.Property(x => x.VideoPath).HasMaxLength(500).HasConversion(x => x!.Value, x => new VideoURL(x!));
        }
    }
}
