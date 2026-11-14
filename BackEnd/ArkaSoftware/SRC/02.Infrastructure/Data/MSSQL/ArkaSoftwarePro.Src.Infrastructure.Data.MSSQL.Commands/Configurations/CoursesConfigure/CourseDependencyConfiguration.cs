using ArkaSoftwarePro.Src.Core.Domain.CoursesAggregate.Entities;
using ArkaSoftwarePro.Src.Core.Domain.CoursesAggregate.ValueOBJs;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace ArkaSoftwarePro.Src.Infrastructure.Data.MSSQL.Commands.Configurations.CoursesConfigure
{
    public class CourseDependencyConfiguration : IEntityTypeConfiguration<CourseDependency>
    {
        public void Configure(EntityTypeBuilder<CourseDependency> builder)
        {
            builder.ToTable("CourseDependencies", "Course");
            builder.Property(x => x.DependencyTitle).HasMaxLength(100).HasConversion(x => x!.Value, x => new Title(x!)).IsRequired();

            builder.HasIndex(x => x.DependencyTitle);


            builder.HasOne(x => x.Course).WithMany(x => x.CourseDependencies).HasForeignKey(x => x.CourseId).OnDelete(DeleteBehavior.Cascade);
        }
    }
}
