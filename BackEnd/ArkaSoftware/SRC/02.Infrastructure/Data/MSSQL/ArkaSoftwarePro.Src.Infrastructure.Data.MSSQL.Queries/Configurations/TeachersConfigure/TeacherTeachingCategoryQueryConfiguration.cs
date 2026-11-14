using ArkaSoftwarePro.Src.Infrastructure.Data.MSSQL.Queries.Entities.Teachers;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace ArkaSoftwarePro.Src.Infrastructure.Data.MSSQL.Queries.Configurations.TeachersConfigure;

public class TeacherTeachingCategoryQueryConfiguration : IEntityTypeConfiguration<TeacherTeachingCategoryQueryModel>
{
    public void Configure(EntityTypeBuilder<TeacherTeachingCategoryQueryModel> builder)
    {
        builder.ToTable("TeachingCategories", "Teacher");
        builder.HasKey(x => x.Id);
        builder.Property(x => x.Name).HasMaxLength(200);
        builder.Property(x => x.Slug).HasMaxLength(200);
        builder.Property(x => x.Description).HasMaxLength(1000);
    }
}
