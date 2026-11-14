using ArkaSoftwarePro.Src.Infrastructure.Data.MSSQL.Queries.Entities.Courses;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace ArkaSoftwarePro.Src.Infrastructure.Data.MSSQL.Queries.Configurations.CoursesConfigure;

public class CourseInstallmentPlanQueryConfiguration : IEntityTypeConfiguration<CourseInstallmentPlanQueryModel>
{
    public void Configure(EntityTypeBuilder<CourseInstallmentPlanQueryModel> builder)
    {
        builder.ToTable("CourseInstallmentPlans", "Course");
        builder.HasKey(x => x.Id);
        builder.Property(x => x.AmountToman).HasColumnType("DECIMAL(18,0)");
        builder.HasOne(x => x.Course)
            .WithMany(x => x.InstallmentPlans)
            .HasForeignKey(x => x.CourseId);
    }
}
