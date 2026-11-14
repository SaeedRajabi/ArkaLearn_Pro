using ArkaSoftwarePro.Src.Infrastructure.Data.MSSQL.Queries.Entities.Courses;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace ArkaSoftwarePro.Src.Infrastructure.Data.MSSQL.Queries.Configurations.CoursesConfigure;

public class CourseDependencyQueryConfiguration : IEntityTypeConfiguration<CourseDependencyQueryModel>
{
    public void Configure(EntityTypeBuilder<CourseDependencyQueryModel> builder)
    {
        builder.ToTable("CourseDependencies", "Course");
        builder.HasKey(x => x.Id);
        builder.Property(x => x.DependencyTitle).HasMaxLength(100);
    }
}
