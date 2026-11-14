using ArkaSoftwarePro.Src.Core.Domain.CoursesAggregate.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace ArkaSoftwarePro.Src.Infrastructure.Data.MSSQL.Commands.Configurations.CoursesConfigure;

public class CourseInstallmentPlanConfiguration : IEntityTypeConfiguration<CourseInstallmentPlan>
{
    public void Configure(EntityTypeBuilder<CourseInstallmentPlan> builder)
    {
        builder.ToTable("CourseInstallmentPlans", "Course");
        builder.Property(x => x.InstallmentNumber).IsRequired();
        builder.Property(x => x.AmountToman).HasColumnType("DECIMAL(18,0)").IsRequired();
        builder.Property(x => x.DueDateUtc);
        builder.HasIndex(x => new { x.CourseId, x.InstallmentNumber }).IsUnique();
        builder.HasOne(x => x.Course)
            .WithMany(x => x.InstallmentPlans)
            .HasForeignKey(x => x.CourseId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}
